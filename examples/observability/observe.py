"""Logs, traces, tokens and cost for the RockTech agent.
The agent code stays the same: this file wraps the client and the tools."""
import contextvars, json, logging, os, re, sys, time, uuid
from datetime import datetime, timezone
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode
from agent import FALLBACK, cost_usd, run_agent

tracer = trace.get_tracer("rocktech.agent")
CONVERSATION = contextvars.ContextVar("conversation_id", default=None)
log = logging.getLogger("rocktech")

# ---------- redaction
PATTERNS = [
    (re.compile(r"\b(?:\d[ -]?){13,19}\b"), "[card]"),            # card numbers, with or without spaces
    (re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+"), "[email]"),
    (re.compile(r"\+?\d[\d -]{8,}\d"), "[phone]"),
]

def redact(text):
    text = str(text)
    for pattern, label in PATTERNS:
        text = pattern.sub(label, text)
    return text

def redact_fields(value):
    if isinstance(value, str):
        return redact(value)
    if isinstance(value, dict):
        return {k: redact_fields(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [redact_fields(v) for v in value]
    return value

# ---------- structured logs
class JsonFormatter(logging.Formatter):
    """One JSON object per line. Cloud Logging reads 'severity' and 'message' as they are."""
    def format(self, record):
        entry = {"time": datetime.now(timezone.utc).isoformat(timespec="milliseconds"),
                 "severity": record.levelname, "message": record.getMessage(),
                 "conversation_id": CONVERSATION.get()}
        entry.update(getattr(record, "fields", {}))
        ctx = trace.get_current_span().get_span_context()
        if ctx.is_valid:
            entry["trace_id"] = format(ctx.trace_id, "032x")
            if os.environ.get("GOOGLE_CLOUD_PROJECT"):          # links the log line to Cloud Trace
                entry["logging.googleapis.com/trace"] = f"projects/{os.environ['GOOGLE_CLOUD_PROJECT']}/traces/{entry['trace_id']}"
        return json.dumps(entry, default=str)

def setup_logging(path="events.jsonl", echo=True):
    log.setLevel(logging.INFO)
    log.propagate = False
    for h in list(log.handlers):
        log.removeHandler(h)
        h.close()
    handlers = [logging.FileHandler(path)] + ([logging.StreamHandler(sys.stdout)] if echo else [])
    for h in handlers:
        h.setFormatter(JsonFormatter())
        log.addHandler(h)

def event(name, level=logging.INFO, **fields):
    log.log(level, name, extra={"fields": redact_fields(fields)})

# ---------- where spans go
def setup_tracing(exporter=None, batch=False):
    from opentelemetry.sdk.resources import Resource
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter, SimpleSpanProcessor
    provider = TracerProvider(resource=Resource.create({"service.name": "rocktech-agent"}))
    processor = BatchSpanProcessor if batch else SimpleSpanProcessor
    provider.add_span_processor(processor(exporter or ConsoleSpanExporter()))
    trace.set_tracer_provider(provider)          # once per process
    return provider

# ---------- model calls
class ObservedClient:
    """Wraps a Gemini client: each call gets a span and a log line with time, tokens and cost."""
    def __init__(self, client):
        self._client = client
        self.models = self

    def generate_content(self, *, model, contents, config=None):
        with tracer.start_as_current_span(f"chat {model}") as span:
            span.set_attribute("gen_ai.operation.name", "chat")
            span.set_attribute("gen_ai.request.model", model)
            start = time.perf_counter()
            try:
                reply = self._client.models.generate_content(model=model, contents=contents, config=config)
            except Exception as e:
                span.record_exception(e)
                span.set_status(Status(StatusCode.ERROR))
                event("model_error", logging.ERROR, model=model, ms=round((time.perf_counter() - start) * 1000),
                      error=type(e).__name__, code=getattr(e, "code", None))
                raise
            ms = round((time.perf_counter() - start) * 1000)
            u = reply.usage_metadata
            fields = {"model": model, "ms": ms,
                      "input_tokens": u.prompt_token_count if u else 0,
                      "output_tokens": u.candidates_token_count if u else 0,
                      "thinking_tokens": (u.thoughts_token_count or 0) if u else 0,
                      "cost_usd": round(cost_usd(u), 6) if u else 0,
                      "tool_requests": [c.name for c in reply.function_calls or []]}
            span.set_attribute("gen_ai.usage.input_tokens", fields["input_tokens"] or 0)
            span.set_attribute("gen_ai.usage.output_tokens", fields["output_tokens"] or 0)
            event("model_call", **fields)
            return reply

# ---------- tool calls
def traced_tool(name, fn):
    """Wrap one tool: a span and a log line with status and time. Pass to run_agent(wrap_tool=...)."""
    def wrapper(**args):
        with tracer.start_as_current_span(f"execute_tool {name}") as span:
            span.set_attribute("gen_ai.tool.name", name)
            start = time.perf_counter()
            try:
                result = fn(**args)
            except Exception as e:
                span.record_exception(e)
                span.set_status(Status(StatusCode.ERROR))
                event("tool_call", logging.ERROR, tool=name, args=args, status="exception",
                      error=type(e).__name__, ms=round((time.perf_counter() - start) * 1000))
                raise
            status = "error" if "error" in result else "ok"
            span.set_attribute("tool.status", status)
            event("tool_call", tool=name, args=args, status=status, ms=round((time.perf_counter() - start) * 1000))
            return result
    return wrapper

# ---------- one customer turn
def handle_message(client, message, conversation_id=None, customer="C-101", **kwargs):
    """Run the agent for one message, with everything recorded. Returns (answer, conversation_id)."""
    conversation_id = conversation_id or uuid.uuid4().hex[:12]
    token = CONVERSATION.set(conversation_id)
    try:
        with tracer.start_as_current_span("invoke_agent rocktech") as span:
            span.set_attribute("gen_ai.conversation.id", conversation_id)
            event("turn_start", customer=customer, text=message[:200])
            start, steps = time.perf_counter(), []
            try:
                answer = run_agent(ObservedClient(client), message, customer=customer,
                                   trace=steps, wrap_tool=traced_tool, **kwargs)
            except Exception as e:
                event("turn_end", logging.ERROR, outcome="error", error=type(e).__name__,
                      steps=len(steps), ms=round((time.perf_counter() - start) * 1000))
                raise
            outcome = "fallback" if answer == FALLBACK else "answered"
            if any(result.get("status") == "needs_approval" for _, _, result in steps):
                outcome = "escalated"
            span.set_attribute("agent.outcome", outcome)
            event("turn_end", outcome=outcome, steps=len(steps), ms=round((time.perf_counter() - start) * 1000))
            return answer, conversation_id
    finally:
        CONVERSATION.reset(token)

# ---------- feedback
def record_feedback(conversation_id, helpful, comment=""):
    token = CONVERSATION.set(conversation_id)
    try:
        event("feedback", helpful=bool(helpful), comment=comment[:500])
    finally:
        CONVERSATION.reset(token)
