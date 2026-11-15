"""Code that talks to Gemini. Every function takes the client as an argument,
so a test can pass in a fake one."""
import os, time
from typing import Literal, Optional
from google.genai import errors, types
from pydantic import BaseModel, ValidationError
from rocktech import order_lookup, refund_process

MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash-lite")
FALLBACK = "Let me pass you to a colleague."

# ---------- the message sorter: JSON out, checked, one retry
SORTER = """You are RockTech's message sorter.
Give each message exactly one label: order_status, refund_request, product_question, complaint, other.
If the customer asks for money back, use refund_request even if they are also complaining.
Reply with JSON only: {"intent": "<label>", "order_id": "<the order number, or null>"}"""

class Route(BaseModel):
    intent: Literal["order_status", "refund_request", "product_question", "complaint", "other"]
    order_id: Optional[str]

def strip_fence(raw):
    raw = (raw or "").strip()
    if raw.startswith("```"):
        raw = raw.strip("`").removeprefix("json").strip()
    return raw

def sort_message(client, text, model=MODEL, tries=2):
    config = types.GenerateContentConfig(
        system_instruction=SORTER, response_mime_type="application/json", max_output_tokens=100,
        thinking_config=types.ThinkingConfig(thinking_budget=0))
    prompt = text
    for _ in range(tries):
        reply = client.models.generate_content(model=model, contents=prompt, config=config)
        try:
            return Route.model_validate_json(strip_fence(reply.text)).model_dump()
        except ValidationError:
            prompt = text + "\n\nYour last reply was not valid. Reply with the JSON object only."
    return {"intent": "other", "order_id": None}     # give up safely: a person will look

# ---------- retries
RETRY_CODES = {429, 500, 503}

def with_retry(fn, *args, tries=4, base=15, sleep=time.sleep, **kwargs):
    """Retry rate limits (429) and server errors (500, 503). Wait 15, 30, 45 s."""
    for attempt in range(tries):
        try:
            return fn(*args, **kwargs)
        except errors.APIError as e:
            if e.code not in RETRY_CODES or attempt == tries - 1:
                raise
            sleep(base * (attempt + 1))

# ---------- the agent loop
TOOLS = [types.Tool(function_declarations=[
    types.FunctionDeclaration(
        name="order_lookup", description="Look up one of this customer's orders by its number.",
        parameters_json_schema={"type": "object", "properties": {"order_id": {"type": "string"}}, "required": ["order_id"]}),
    types.FunctionDeclaration(
        name="refund_process", description="Refund part or all of one of this customer's orders.",
        parameters_json_schema={"type": "object", "properties": {
            "order_id": {"type": "string"}, "amount": {"type": "number"},
            "reason": {"type": "string", "enum": ["damaged", "late", "not_as_described", "changed_mind"]}},
            "required": ["order_id", "amount", "reason"]}),
])]
SYSTEM = "You are RockTech's support assistant. Use the tools for any fact about an order. Be brief."

def run_tool(funcs, name, args):
    if name not in funcs:
        return {"error": f"Unknown tool {name}"}
    try:
        return funcs[name](**args)
    except Exception as e:                          # a broken tool becomes data, not a crash
        return {"error": f"{name} failed: {e}"}

def run_agent(client, message, customer="C-101", max_steps=8, model=MODEL, trace=None, wrap_tool=None):
    funcs = {   # the customer comes from the login, never from the model
        "order_lookup": lambda order_id: order_lookup(order_id, customer),
        "refund_process": lambda order_id, amount, reason: refund_process(order_id, amount, reason, customer),
    }
    if wrap_tool:                                   # new: lets observe.py time and log each tool
        funcs = {name: wrap_tool(name, fn) for name, fn in funcs.items()}
    config = types.GenerateContentConfig(system_instruction=SYSTEM, tools=TOOLS, max_output_tokens=500)
    contents = [types.Content(role="user", parts=[types.Part(text=message)])]
    for _ in range(max_steps):
        reply = client.models.generate_content(model=model, contents=contents, config=config)
        calls = reply.function_calls or []
        if not calls:
            return reply.text
        contents.append(reply.candidates[0].content)
        parts = []
        for c in calls:
            result = run_tool(funcs, c.name, dict(c.args or {}))
            if trace is not None:
                trace.append((c.name, dict(c.args or {}), result))
            parts.append(types.Part.from_function_response(name=c.name, response=result))
        contents.append(types.Content(role="user", parts=parts))
    return FALLBACK

# ---------- cost
PRICE_IN, PRICE_OUT = 0.10, 0.40        # USD per 1M tokens, illustrative: check the pricing page

def cost_usd(usage):
    out = (usage.candidates_token_count or 0) + (usage.thoughts_token_count or 0)
    return ((usage.prompt_token_count or 0) * PRICE_IN + out * PRICE_OUT) / 1_000_000
