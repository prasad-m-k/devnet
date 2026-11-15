import json, logging
from types import SimpleNamespace
from google.genai import types
from my_agent.agent import log_model_call, log_tool_call, root_agent, start_tool_timer

def test_callbacks_are_attached():
    assert root_agent.after_model_callback is log_model_call
    assert root_agent.after_tool_callback is log_tool_call

def test_callbacks_log_and_change_nothing(caplog):
    ctx = SimpleNamespace(agent_name="rocktech_support", invocation_id="inv-1")
    reply = SimpleNamespace(usage_metadata=types.GenerateContentResponseUsageMetadata(
        prompt_token_count=800, candidates_token_count=20))
    tool = SimpleNamespace(name="order_lookup")
    with caplog.at_level(logging.INFO, logger="rocktech.adk"):
        assert log_model_call(callback_context=ctx, llm_response=reply) is None
        assert start_tool_timer(tool=tool, args={"order_id": "9999"}, tool_context=ctx) is None
        assert log_tool_call(tool=tool, args={"order_id": "9999"}, tool_context=ctx,
                             tool_response={"error": "No order 9999 on this account"}) is None
    model, tool_line = [json.loads(r.getMessage()) for r in caplog.records]
    assert model["input_tokens"] == 800 and tool_line["status"] == "error"
