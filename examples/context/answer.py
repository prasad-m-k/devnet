"""One grounded answer: build the context, ask the model, check the citations, retry once."""
import os
from google.genai import types
from context import build_context, check_citations

MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash-lite")
HANDOFF = "I'll pass this to a colleague, who will reply by email."

def answer(client, customer, message, history=(), summary=None, model=MODEL):
    ctx = build_context(customer, message, history, summary)
    config = types.GenerateContentConfig(system_instruction=ctx.system, max_output_tokens=300)
    contents = list(ctx.contents)
    for attempt in range(2):
        reply = client.models.generate_content(model=model, contents=contents, config=config).text or ""
        check = check_citations(reply, ctx.doc_ids)
        if check["ok"] or (not ctx.doc_ids and "colleague" in reply.lower()):
            return reply, ctx
        contents = contents + [
            types.Content(role="model", parts=[types.Part(text=reply)]),
            types.Content(role="user", parts=[types.Part(text=(
                "Your answer must cite the documents it uses, like [H-2], and only these: "
                f"{', '.join(ctx.doc_ids) or 'none'}. Rewrite it."))])]
    return HANDOFF, ctx
