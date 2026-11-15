import pytest
from fakes import FakeClient, text_reply, usage
from agent import run_agent, cost_usd

def test_agent_caps_reply_length():
    fake = FakeClient(text_reply("Hello!"))
    run_agent(fake, "Hi")
    assert fake.models.calls[0]["config"].max_output_tokens == 500

def test_cost_of_one_call():
    # 1,000 in and 200 out at $0.10 / $0.40 per 1M tokens (illustrative)
    assert cost_usd(usage(prompt=1000, reply=200)) == pytest.approx(0.00018)

def test_thinking_tokens_are_billed():
    assert cost_usd(usage(prompt=1000, reply=200, thoughts=800)) == pytest.approx(0.0005)
