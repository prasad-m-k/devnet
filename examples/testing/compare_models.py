"""Run the golden set on every Flash model your key can use and compare with the baseline."""
import json, pathlib, statistics
from google import genai
from agent import MODEL
from evals import run_golden, pass_rate

client = genai.Client()
baseline_file = pathlib.Path("results") / "baseline.json"
baseline_file.parent.mkdir(exist_ok=True)

names = sorted(m.name.removeprefix("models/") for m in client.models.list()
               if "generateContent" in (m.supported_actions or []) and "flash" in m.name)
print("candidates:", names)

if not baseline_file.exists():                     # first run: record today's model as the baseline
    baseline_file.write_text(json.dumps({"model": MODEL, "rows": run_golden(client, model=MODEL)}, indent=1))
baseline = json.loads(baseline_file.read_text())
passed_before = {r["text"] for r in baseline["rows"] if r["ok"]}
print(f"baseline {baseline['model']}: {pass_rate(baseline['rows']):.0%}")

for name in names:
    rows = run_golden(client, model=name)
    broke = [r["text"] for r in rows if not r["ok"] and r["text"] in passed_before]
    secs = statistics.median(r["seconds"] for r in rows)
    print(f"{name:40} pass {pass_rate(rows):4.0%}  median {secs:.1f} s  regressions {len(broke)}")
    for text in broke:
        print("    now fails:", text)
    (baseline_file.parent / f"{name}.json").write_text(json.dumps(rows, indent=1))
