from fakes import FakeClient, text_reply, tool_reply
from observe import event, handle_message, redact

def test_one_json_line_per_event(events):
    event("tool_call", tool="order_lookup", status="ok", ms=12)
    [e] = events()
    assert e["message"] == "tool_call" and e["severity"] == "INFO" and e["ms"] == 12

def test_a_turn_is_logged_start_to_end(events):
    fake = FakeClient(tool_reply("order_lookup", order_id="4471"), text_reply("Your speaker has shipped."))
    answer, cid = handle_message(fake, "Where is order 4471?")
    log = events()
    assert [e["message"] for e in log] == ["turn_start", "model_call", "tool_call", "model_call", "turn_end"]
    assert {e["conversation_id"] for e in log} == {cid}            # every line carries the conversation id
    assert len({e["trace_id"] for e in log}) == 1                   # and the same trace id
    assert log[-1]["outcome"] == "answered" and log[-1]["steps"] == 1

def test_card_email_and_phone_are_masked():
    text = "Card 4111 1111 1111 1111, mail asha@example.com, call +91 98450 12345 about order 4471"
    assert redact(text) == "Card [card], mail [email], call [phone] about order 4471"

def test_logs_never_hold_the_card_number(events):
    fake = FakeClient(text_reply("I can't take card details here."))
    handle_message(fake, "Refund to my card 4111-1111-1111-1111 please")
    raw = " ".join(str(e) for e in events())
    assert "4111" not in raw and "[card]" in raw

def test_escalation_and_fallback_are_outcomes(events):
    handle_message(FakeClient(tool_reply("refund_process", order_id="5520", amount=899, reason="damaged"),
                              text_reply("A colleague will approve it.")), "Refund 5520")
    handle_message(FakeClient(*[tool_reply("order_lookup", order_id="4471")] * 2), "Where is 4471?", max_steps=2)
    assert [e["outcome"] for e in events() if e["message"] == "turn_end"] == ["escalated", "fallback"]
