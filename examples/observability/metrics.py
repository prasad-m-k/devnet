"""Turn the event log into numbers, and the numbers into alerts."""
import json, math, pathlib
from collections import defaultdict

def load_events(path="events.jsonl"):
    return [json.loads(line) for line in pathlib.Path(path).read_text().splitlines() if line.strip()]

def pct(values, q):
    """The q-th percentile (nearest rank): pct(times, 95) is the time 95% of calls beat."""
    values = sorted(v for v in values if v is not None)
    if not values:
        return None
    return values[max(0, math.ceil(q / 100 * len(values)) - 1)]

def share(items, test):
    return round(sum(1 for i in items if test(i)) / len(items), 4) if items else 0.0

def of(events, name):
    return [e for e in events if e["message"] == name]

def summarize(events):
    calls, errors = of(events, "model_call"), of(events, "model_error")
    turns, tools, feedback = of(events, "turn_end"), of(events, "tool_call"), of(events, "feedback")
    cost = sum(e["cost_usd"] for e in calls)
    return {
        "turns": len(turns),
        "model_calls": len(calls) + len(errors),
        "model_error_rate": share(calls + errors, lambda e: e["message"] == "model_error"),
        "rate_limited": sum(1 for e in errors if e.get("code") == 429),
        "model_ms_p50": pct([e["ms"] for e in calls], 50),
        "model_ms_p95": pct([e["ms"] for e in calls], 95),
        "turn_ms_p95": pct([e["ms"] for e in turns], 95),
        "tool_error_rate": share(tools, lambda e: e["status"] in ("error", "exception")),
        "fallback_rate": share(turns, lambda e: e["outcome"] == "fallback"),
        "escalation_rate": share(turns, lambda e: e["outcome"] == "escalated"),
        "tokens": sum(e["input_tokens"] + e["output_tokens"] + e["thinking_tokens"] for e in calls),
        "cost_usd": round(cost, 6),
        "cost_per_turn": round(cost / len(turns), 6) if turns else 0.0,
        "unhelpful_rate": share(feedback, lambda e: not e["helpful"]),
    }

def cost_by_conversation(events):
    totals = defaultdict(float)
    for e in of(events, "model_call"):
        totals[e["conversation_id"]] += e["cost_usd"]
    return dict(sorted(totals.items(), key=lambda kv: -kv[1]))

# ---------- alerts
RULES = [   # (metric, limit, what it means). Limits are illustrative: set yours from a normal week.
    ("model_error_rate", 0.05, "more than 5% of model calls failed"),
    ("model_ms_p95", 5000, "the slowest 5% of model calls take over 5 seconds"),
    ("tool_error_rate", 0.05, "more than 5% of tool calls failed"),
    ("fallback_rate", 0.02, "the agent ran out of steps in over 2% of turns"),
    ("cost_per_turn", 0.002, "a turn costs over $0.002 on average"),
    ("unhelpful_rate", 0.20, "over 20% of feedback says the answer did not help"),
]

def check_alerts(summary, rules=RULES):
    return [f"{metric} = {summary[metric]}: {meaning}"
            for metric, limit, meaning in rules
            if summary.get(metric) is not None and summary[metric] > limit]

def conversations_to_review(events):
    """Conversations with a thumbs-down, a fallback or an error, newest first."""
    bad = {e["conversation_id"] for e in of(events, "feedback") if not e["helpful"]}
    bad |= {e["conversation_id"] for e in of(events, "turn_end") if e["outcome"] in ("fallback", "error")}
    return [cid for cid in dict.fromkeys(e["conversation_id"] for e in reversed(events)) if cid in bad]

def conversation(events, conversation_id):
    return [e for e in events if e["conversation_id"] == conversation_id]
