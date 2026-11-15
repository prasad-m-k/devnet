import pytest
from google.genai import errors
from agent import with_retry

def api_error(code):
    return errors.APIError(code, {"error": {"code": code, "message": "test", "status": "TEST"}})

def flaky(*outcomes):
    """A function that raises or returns each outcome in turn."""
    outcomes = list(outcomes)
    def fn():
        o = outcomes.pop(0)
        if isinstance(o, Exception):
            raise o
        return o
    return fn

def test_429_waits_then_succeeds():
    waits = []
    assert with_retry(flaky(api_error(429), api_error(429), "ok"), sleep=waits.append) == "ok"
    assert waits == [15, 30]

def test_503_is_retried_too():
    waits = []
    assert with_retry(flaky(api_error(503), "ok"), sleep=waits.append) == "ok"
    assert waits == [15]

def test_400_is_not_retried():
    waits = []
    with pytest.raises(errors.APIError) as e:
        with_retry(flaky(api_error(400), "ok"), sleep=waits.append)
    assert e.value.code == 400 and waits == []

def test_gives_up_after_four_tries():
    waits = []
    with pytest.raises(errors.APIError):
        with_retry(flaky(*[api_error(503)] * 4), sleep=waits.append)
    assert waits == [15, 30, 45]

def test_error_classes():
    assert isinstance(api_error(429), errors.APIError)
    assert isinstance(errors.ClientError(429, {}), errors.APIError)
