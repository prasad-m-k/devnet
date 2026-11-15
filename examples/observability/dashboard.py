"""A quick dashboard from events.jsonl: four charts and the headline numbers."""
import json
import matplotlib.pyplot as plt
import pandas as pd
from metrics import check_alerts, load_events, summarize

events = load_events("events.jsonl")
df = pd.DataFrame(events)
df["time"] = pd.to_datetime(df["time"])
calls, turns = df[df.message == "model_call"], df[df.message == "turn_end"]
tools = df[df.message == "tool_call"]

fig, ax = plt.subplots(2, 2, figsize=(11, 7))
calls["ms"].plot.hist(bins=20, ax=ax[0, 0], title="Model call time (ms)")
turns["outcome"].value_counts().plot.bar(ax=ax[0, 1], rot=0, title="How turns ended")
calls.groupby("conversation_id")["cost_usd"].sum().plot.hist(bins=15, ax=ax[1, 0], title="Cost per conversation (USD)")
tools.groupby(["tool", "status"]).size().unstack(fill_value=0).plot.bar(stacked=True, ax=ax[1, 1], rot=0, title="Tool results")
fig.tight_layout()
fig.savefig("dashboard.png", dpi=110)

summary = summarize(events)
print(json.dumps(summary, indent=1))
for alert in check_alerts(summary):
    print("ALERT:", alert)
