from fakes import FakeClient, text_reply, tool_reply
from observe import handle_message

def test_turn_makes_one_trace_with_child_spans(spans):
    fake = FakeClient(tool_reply("order_lookup", order_id="4471"), text_reply("Shipped.", prompt=900, reply=12))
    handle_message(fake, "Where is order 4471?")
    done = spans.get_finished_spans()
    names = [s.name for s in done]
    assert sorted(names) == sorted(["chat gemini-2.5-flash-lite", "execute_tool order_lookup",
                                    "chat gemini-2.5-flash-lite", "invoke_agent rocktech"])
    root = next(s for s in done if s.name == "invoke_agent rocktech")
    assert all(s.parent.span_id == root.context.span_id for s in done if s is not root)
    assert {s.context.trace_id for s in done} == {root.context.trace_id}
    last_chat = [s for s in done if s.name.startswith("chat")][-1]
    assert last_chat.attributes["gen_ai.usage.input_tokens"] == 900
    assert root.attributes["agent.outcome"] == "answered"
