import json, os, sys, pytest
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
sys.path.insert(0, os.path.dirname(__file__))
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter
import observe, rocktech

EXPORTER = InMemorySpanExporter()
observe.setup_tracing(EXPORTER)          # the tracer provider can be set once per process

@pytest.fixture(autouse=True)
def fresh_state():
    rocktech.PAID.clear()
    EXPORTER.clear()
    yield

@pytest.fixture
def spans():
    return EXPORTER                      # EXPORTER.get_finished_spans() after the code runs

@pytest.fixture
def events(tmp_path):
    """Log to a temporary file; call events() to read what was logged."""
    path = tmp_path / "events.jsonl"
    observe.setup_logging(path, echo=False)
    return lambda: [json.loads(line) for line in path.read_text().splitlines()]
