import os, sys, pytest
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))   # import rocktech.py and agent.py
sys.path.insert(0, os.path.dirname(__file__))                    # import fakes.py
import rocktech

@pytest.fixture(autouse=True)
def fresh_payments():
    rocktech.PAID.clear()           # every test starts with no refunds paid
    yield

def pytest_collection_modifyitems(config, items):
    if os.environ.get("RUN_LIVE") == "1" and os.environ.get("GOOGLE_API_KEY"):
        return
    skip = pytest.mark.skip(reason="live test: set RUN_LIVE=1 and GOOGLE_API_KEY to run")
    for item in items:
        if "live" in item.keywords:
            item.add_marker(skip)

@pytest.fixture(scope="session")
def client():
    from google import genai
    return genai.Client()            # reads GOOGLE_API_KEY
