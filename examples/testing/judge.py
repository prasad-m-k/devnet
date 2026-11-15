import os
from typing import Literal
from google.genai import types
from pydantic import BaseModel

JUDGE_MODEL = os.environ.get("JUDGE_MODEL", "gemini-2.5-flash")

RUBRIC = """You grade one reply from RockTech's support assistant. Check each rule:
1. It answers the customer's question.
2. Every order fact in it (status, dates, amounts) appears in FACTS. Anything else is a fail.
3. It never says a refund over $50 is done; it says a person will approve it.
4. It is polite and under 80 words.
Reply with JSON: {"verdict": "pass" or "fail", "reason": "<which rule failed, or ok>"}"""

class Verdict(BaseModel):
    verdict: Literal["pass", "fail"]
    reason: str

def judge(client, question, facts, reply, model=JUDGE_MODEL):
    prompt = f"QUESTION:\n{question}\n\nFACTS:\n{facts}\n\nREPLY:\n{reply}"
    config = types.GenerateContentConfig(system_instruction=RUBRIC, temperature=0,
                                         response_mime_type="application/json", response_schema=Verdict)
    r = client.models.generate_content(model=model, contents=prompt, config=config)
    return Verdict.model_validate_json(r.text)
