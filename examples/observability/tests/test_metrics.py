import pytest
from fakes import FakeClient, text_reply, tool_reply
from metrics import check_alerts, conversations_to_review, cost_by_conversation, pct, summarize
from observe import handle_message, record_feedback

def test_percentile():
    times = list(range(1, 101))            # 1 to 100 ms
    assert pct(times, 50) == 50 and pct(times, 95) == 95 and pct([], 95) is None

def test_summary_from_real_log(events):
    a = handle_message(FakeClient(tool_reply("order_lookup", order_id="4471"),
                                  text_reply("Shipped.", prompt=1000, reply=200)), "Where is 4471?")[1]
    b = handle_message(FakeClient(*[tool_reply("order_lookup", order_id="4471")] * 2), "Help", max_steps=2)[1]
    record_feedback(a, True)
    record_feedback(b, False, "It went round in circles")
    s = summarize(events())
    assert s["turns"] == 2 and s["model_calls"] == 4
    assert s["fallback_rate"] == 0.5 and s["unhelpful_rate"] == 0.5
    assert s["cost_usd"] == pytest.approx(3 * 0.00002 + 0.00018)   # three calls at 120 in / 20 out, one at 1000 / 200
    assert conversations_to_review(events()) == [b]
    assert list(cost_by_conversation(events())) == [a, b]                        # a is the costly one

def test_alerts_fire_only_over_the_limit():
    quiet = {"model_error_rate": 0.01, "model_ms_p95": 1800, "tool_error_rate": 0.0,
             "fallback_rate": 0.0, "cost_per_turn": 0.0004, "unhelpful_rate": 0.1}
    assert check_alerts(quiet) == []
    busy = dict(quiet, model_error_rate=0.12, fallback_rate=0.05)
    alerts = check_alerts(busy)
    assert len(alerts) == 2 and alerts[0].startswith("model_error_rate = 0.12")
