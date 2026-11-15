"""Make a realistic event log with no API key: scripted replies, random delays.
Run: python simulate.py   (writes events.jsonl, takes about 20 seconds)"""
import random, sys, time
sys.path.insert(0, "tests")
from google.genai import errors
from fakes import FakeClient, text_reply, tool_reply
from observe import handle_message, record_feedback, setup_logging

random.seed(7)

class SlowFake(FakeClient):
    """The fake client, plus a delay like a real network call."""
    def __init__(self, *replies):
        super().__init__(*replies)
        real = self.models.generate_content
        def slow(**kwargs):
            time.sleep(random.choice([0.02, 0.04, 0.06, 0.08, 0.12, 0.6]))
            return real(**kwargs)
        self.models.generate_content = slow

SCRIPTS = [   # (customer message, the model's replies, was the answer helpful?)
    ("Where is order 4471?", [tool_reply("order_lookup", order_id="4471"),
                              text_reply("Your speaker has shipped.", prompt=900, reply=12)], True),
    ("Refund my charger, order 6012, it's broken", [tool_reply("refund_process", order_id="6012", amount=30, reason="damaged"),
                                                    text_reply("Done: $30 is on its way back.", prompt=1100, reply=14)], True),
    ("My laptop 5520 is cracked, refund it", [tool_reply("refund_process", order_id="5520", amount=899, reason="damaged"),
                                             text_reply("A colleague will approve your $899 refund today.", prompt=1200, reply=16)], True),
    ("What about order 9999?", [tool_reply("order_lookup", order_id="9999"),
                                text_reply("I can't find order 9999 on your account.", prompt=950, reply=13)], False),
    ("It keeps going wrong, check everything", [tool_reply("order_lookup", order_id="4471")] * 8, False),
]

setup_logging("events.jsonl", echo=False)
for i in range(40):
    message, replies, helpful = random.choice(SCRIPTS)
    if i % 13 == 5:                                     # now and then, Google says 429
        replies = [errors.APIError(429, {"error": {"code": 429, "message": "quota", "status": "RESOURCE_EXHAUSTED"}})]
    try:
        _, cid = handle_message(SlowFake(*replies), message + " My card is 4111 1111 1111 1111.")
    except errors.APIError:
        continue
    if random.random() < 0.6:
        record_feedback(cid, helpful)
print("wrote events.jsonl")
