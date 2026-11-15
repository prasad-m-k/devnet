import os, sys, pytest
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path[:0] = [ROOT, os.path.dirname(os.path.abspath(__file__))]
import rocktech

@pytest.fixture(autouse=True)
def fresh_payments():
    rocktech.PAID.clear()
    yield
