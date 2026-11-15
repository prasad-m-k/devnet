import pytest
from fakes import FakeClient, text_reply
from evals import load_golden, run_golden, pass_rate

PASS_RATE = 0.90          # agree this number with the team, then only ever raise it

def test_golden_file_is_well_formed():                 # free: runs on every push
    cases = load_golden()
    assert len(cases) == 20
    assert all(set(c) == {"text", "intent", "order_id"} for c in cases)

def test_harness_counts_correctly():                   # free: a fake that always says order_status
    cases = load_golden()
    fake = FakeClient(*[text_reply('{"intent": "order_status", "order_id": null}') for _ in cases])
    rows = run_golden(fake, cases=cases)
    assert pass_rate(rows) == 1 / 20                   # only "hasn't arrived" matches exactly

@pytest.mark.live
def test_sorter_golden_set(client):
    rows = run_golden(client)
    rate = pass_rate(rows)
    print(f"\npass rate {rate:.0%} ({sum(r['ok'] for r in rows)}/{len(rows)})")
    for r in rows:
        if not r["ok"]:
            print(f"  FAIL {r['text']!r}: wanted {r['intent']}/{r['order_id']}, got {r['got']}")
    assert rate >= PASS_RATE
