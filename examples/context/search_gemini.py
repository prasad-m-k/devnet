"""Search by meaning with Gemini embeddings: a drop-in for keyword_search (live, costs a little)."""
import numpy as np
from google.genai import types
from rocktech import HELP

EMBED_MODEL = "gemini-embedding-001"

class GeminiSearch:
    def __init__(self, client, min_score=0.55):
        self.client, self.min_score = client, min_score
        texts = [d["title"] + ". " + d["text"] for d in HELP]
        self.vectors = self._embed(texts, "RETRIEVAL_DOCUMENT")      # once, at start-up

    def _embed(self, texts, task):
        r = self.client.models.embed_content(model=EMBED_MODEL, contents=texts,
                                             config=types.EmbedContentConfig(task_type=task))
        v = np.array([e.values for e in r.embeddings])
        return v / np.linalg.norm(v, axis=1, keepdims=True)

    def __call__(self, query, k=3):
        q = self._embed([query], "RETRIEVAL_QUERY")[0]
        scores = self.vectors @ q
        best = np.argsort(-scores)[:k]
        return [{**HELP[i], "score": round(float(scores[i]), 2)} for i in best if scores[i] >= self.min_score]

# build_context(customer, message, search=GeminiSearch(client))
