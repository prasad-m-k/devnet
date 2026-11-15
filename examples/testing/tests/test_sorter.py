from fakes import FakeClient, text_reply
from agent import sort_message

def test_clean_json_is_read():
    fake = FakeClient(text_reply('{"intent": "order_status", "order_id": "4471"}'))
    assert sort_message(fake, "Where is order 4471?") == {"intent": "order_status", "order_id": "4471"}

def test_code_fence_is_stripped():
    fake = FakeClient(text_reply('```json\n{"intent": "refund_request", "order_id": "6012"}\n```'))
    assert sort_message(fake, "Refund 6012")["intent"] == "refund_request"

def test_bad_json_is_retried_once():
    fake = FakeClient(text_reply("Sure! This looks like an order question."),
                      text_reply('{"intent": "order_status", "order_id": "4471"}'))
    assert sort_message(fake, "Where is order 4471?")["intent"] == "order_status"
    assert len(fake.models.calls) == 2
    assert "not valid" in fake.models.calls[1]["contents"]     # the retry says what went wrong

def test_label_outside_the_list_is_rejected():
    fake = FakeClient(text_reply('{"intent": "shipping", "order_id": "4471"}'),
                      text_reply('{"intent": "shipping", "order_id": "4471"}'))
    assert sort_message(fake, "Where is order 4471?") == {"intent": "other", "order_id": None}

def test_the_request_asks_for_json():
    fake = FakeClient(text_reply('{"intent": "other", "order_id": null}'))
    sort_message(fake, "Hi")
    config = fake.models.calls[0]["config"]
    assert config.response_mime_type == "application/json"
    assert config.max_output_tokens <= 100
