import pytest
from google.genai import errors
from opentelemetry.trace import StatusCode
from fakes import FakeClient
from observe import handle_message

def test_429_is_logged_and_still_raised(events, spans):
    fake = FakeClient(errors.APIError(429, {"error": {"code": 429, "message": "quota", "status": "RESOURCE_EXHAUSTED"}}))
    with pytest.raises(errors.APIError):
        handle_message(fake, "Where is order 4471?")
    log = events()
    assert [e["message"] for e in log] == ["turn_start", "model_error", "turn_end"]
    assert log[1]["code"] == 429 and log[1]["severity"] == "ERROR"
    assert log[2]["outcome"] == "error"
    chat = next(s for s in spans.get_finished_spans() if s.name.startswith("chat"))
    assert chat.status.status_code == StatusCode.ERROR
