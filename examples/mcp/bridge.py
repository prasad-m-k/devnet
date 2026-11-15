"""Give an MCP server's tools to Gemini, and run the agent loop with them."""
import json, os
from google.genai import types

MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash-lite")
FALLBACK = "Let me pass you to a colleague."

# ---------- convert
def gemini_tools(list_tools_result):
    """MCP tool list -> one Gemini Tool. The JSON schema passes through as it is."""
    return types.Tool(function_declarations=[
        types.FunctionDeclaration(name=t.name, description=t.description or "",
                                  parameters_json_schema=t.input_schema)
        for t in list_tools_result.tools])

def as_dict(result):
    """MCP CallToolResult -> the dict Gemini expects as a function response."""
    text = "\n".join(c.text for c in result.content if getattr(c, "text", None))
    if result.is_error:
        return {"error": text}
    if result.structured_content is not None:
        return result.structured_content
    try:
        value = json.loads(text)
        return value if isinstance(value, dict) else {"result": value}
    except json.JSONDecodeError:
        return {"result": text}

# ---------- the loop
SYSTEM = "You are RockTech's support assistant. Use the tools for any fact about an order. Be brief."

async def run_agent_mcp(gemini, mcp, message, max_steps=8, model=MODEL, allowed=None, trace=None):
    """The agent loop from the Gemini pages, with tools that live on an MCP server."""
    listed = await mcp.list_tools()
    if allowed is not None:                         # only the tools this agent should have
        listed.tools = [t for t in listed.tools if t.name in allowed]
    config = types.GenerateContentConfig(system_instruction=SYSTEM, tools=[gemini_tools(listed)],
                                         max_output_tokens=500)
    names = {t.name for t in listed.tools}
    contents = [types.Content(role="user", parts=[types.Part(text=message)])]
    for _ in range(max_steps):
        reply = await gemini.aio.models.generate_content(model=model, contents=contents, config=config)
        calls = reply.function_calls or []
        if not calls:
            return reply.text
        contents.append(reply.candidates[0].content)
        parts = []
        for c in calls:
            args = dict(c.args or {})
            if c.name in names:
                result = as_dict(await mcp.call_tool(c.name, args))
            else:
                result = {"error": f"Tool {c.name} is not available"}
            if trace is not None:
                trace.append((c.name, args, result))
            parts.append(types.Part.from_function_response(name=c.name, response=result))
        contents.append(types.Content(role="user", parts=parts))
    return FALLBACK
