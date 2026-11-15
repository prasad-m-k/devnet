"""The ADK agent from 'Build your first agent', with callbacks that log tokens and tool times."""
import json, logging, time
from google.adk.agents import Agent

log = logging.getLogger("rocktech.adk")
_started = {}

def order_lookup(order_id: str) -> dict:
    """Look up one RockTech order by its number, for status, delivery and tracking.

    Args:
        order_id: The order number, for example "4471".
    """
    orders = {"4471": {"item": "Wireless speaker", "status": "shipped", "arriving": "2 November"}}
    return orders.get(order_id, {"error": f"No order {order_id} on this account"})

def log_model_call(callback_context, llm_response):
    u = llm_response.usage_metadata
    if u:
        log.info(json.dumps({"message": "model_call", "agent": callback_context.agent_name,
                             "invocation_id": callback_context.invocation_id,
                             "input_tokens": u.prompt_token_count, "output_tokens": u.candidates_token_count}))
    return None                                   # None: keep the model's reply as it is

def start_tool_timer(tool, args, tool_context):
    _started[(tool_context.invocation_id, tool.name)] = time.perf_counter()
    return None                                   # None: run the tool as normal

def log_tool_call(tool, args, tool_context, tool_response):
    start = _started.pop((tool_context.invocation_id, tool.name), time.perf_counter())
    status = "error" if isinstance(tool_response, dict) and "error" in tool_response else "ok"
    log.info(json.dumps({"message": "tool_call", "tool": tool.name, "args": args, "status": status,
                         "ms": round((time.perf_counter() - start) * 1000),
                         "invocation_id": tool_context.invocation_id}))
    return None                                   # None: keep the tool's result as it is

root_agent = Agent(
    name="rocktech_support",
    model="gemini-flash-latest",
    description="Answers RockTech customers' questions about their orders.",
    instruction="You are RockTech's support assistant. Use order_lookup for any fact about an order; never guess. Be brief.",
    tools=[order_lookup],
    after_model_callback=log_model_call,
    before_tool_callback=start_tool_timer,
    after_tool_callback=log_tool_call,
)
