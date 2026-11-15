"""Live evaluations: these call the real model and cost money."""
import json, pathlib, time
from agent import MODEL, sort_message, with_retry

GOLDEN_FILE = pathlib.Path(__file__).parent / "tests" / "golden.jsonl"

def load_golden(path=GOLDEN_FILE):
    return [json.loads(line) for line in pathlib.Path(path).read_text().splitlines() if line.strip()]

def run_golden(client, model=MODEL, cases=None):
    rows = []
    for case in cases or load_golden():
        start = time.perf_counter()
        got = with_retry(sort_message, client, case["text"], model=model)
        want = {"intent": case["intent"], "order_id": case["order_id"]}
        rows.append({**case, "got": got, "ok": got == want, "seconds": round(time.perf_counter() - start, 2)})
    return rows

def pass_rate(rows):
    return sum(r["ok"] for r in rows) / len(rows)
