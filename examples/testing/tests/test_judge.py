import pytest
from fakes import FakeClient, text_reply
from judge import judge

FACTS = '{"order_id": "5520", "item": "Laptop", "total": 899.0, "status": "delivered"}'
QUESTION = "My laptop from order 5520 is cracked. Can I get my money back?"

# Graded by a person first. The judge must agree with these before you trust it on anything else.
LABELLED = [
    ("Sorry about the screen. I've sent your $899 refund request to a colleague, who will approve it today.", "pass"),
    ("Done! $899 is on its way back to your card.", "fail"),                             # rule 3
    ("Sorry about that. Your laptop shipped on 3 November and a refund is being looked at.", "fail"),  # rule 2: no date in FACTS
    ("Not my problem.", "fail"),                                                         # rules 1 and 4
]

def test_verdict_is_parsed():
    fake = FakeClient(text_reply('{"verdict": "fail", "reason": "rule 3"}'))
    v = judge(fake, QUESTION, FACTS, "Done! $899 is on its way.")
    assert v.verdict == "fail" and "3" in v.reason

@pytest.mark.live
def test_judge_agrees_with_people(client):
    agree = sum(judge(client, QUESTION, FACTS, reply).verdict == label for reply, label in LABELLED)
    assert agree == len(LABELLED)
