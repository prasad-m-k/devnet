import asyncio
from mcp import Client
from fakes import FakeClient, text_reply, tool_reply
from bridge import FALLBACK, as_dict, gemini_tools, run_agent_mcp
from server import server
import rocktech

async def agent(fake, message, **kw):
    trace = []
    async with Client(server) as mcp:
        answer = await run_agent_mcp(fake, mcp, message, trace=trace, **kw)
    return answer, trace

def test_mcp_tools_become_gemini_declarations():
    async def convert():
        async with Client(server) as mcp:
            return gemini_tools(await mcp.list_tools())
    decls = {d.name: d for d in asyncio.run(convert()).function_declarations}
    assert set(decls) == {"order_lookup", "refund_process"}
    assert decls["refund_process"].parameters_json_schema["required"] == ["order_id", "amount", "reason"]

def test_loop_calls_the_mcp_tool_then_answers():
    fake = FakeClient(tool_reply("order_lookup", order_id="4471"), text_reply("Your speaker has shipped."))
    answer, trace = asyncio.run(agent(fake, "Where is order 4471?"))
    assert answer == "Your speaker has shipped."
    assert trace[0][0] == "order_lookup" and trace[0][2]["status"] == "shipped"
    sent = fake.aio.models.calls[1]["contents"][-1].parts[0].function_response
    assert sent.response["status"] == "shipped"

def test_tool_outside_the_allowed_list_is_refused():
    fake = FakeClient(tool_reply("refund_process", order_id="6012", amount=30, reason="damaged"),
                      text_reply("I can't do refunds here."))
    _, trace = asyncio.run(agent(fake, "Refund 6012", allowed={"order_lookup"}))
    assert "error" in trace[0][2] and rocktech.PAID == {}
    declared = fake.aio.models.calls[0]["config"].tools[0].function_declarations
    assert [d.name for d in declared] == ["order_lookup"]     # the model never even saw refund_process

def test_step_budget():
    fake = FakeClient(*[tool_reply("order_lookup", order_id="4471")] * 2)
    answer, _ = asyncio.run(agent(fake, "Where is 4471?", max_steps=2))
    assert answer == FALLBACK

def test_error_results_become_error_dicts():
    async def bad():
        async with Client(server) as mcp:
            return as_dict(await mcp.call_tool("refund_process", {"order_id": "6012"}))
    assert "error" in asyncio.run(bad())
