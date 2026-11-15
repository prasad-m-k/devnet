"""GeminiSearch with a fake embedding client: checks the maths and the threshold, offline."""
from types import SimpleNamespace
from rocktech import HELP
from search_gemini import GeminiSearch

class FakeEmbedder:
    """Each text becomes [return, warranty, delivery, none of these]: crude, but real cosine maths."""
    def __init__(self):
        self.models = self
    def embed_content(self, model, contents, config):
        def vec(t):
            t = t.lower()
            v = [float("return" in t), float("warranty" in t), float("deliver" in t)]
            return v + [0.0 if any(v) else 1.0]
        return SimpleNamespace(embeddings=[SimpleNamespace(values=vec(t)) for t in contents])

def test_best_match_first_and_threshold_applies():
    search = GeminiSearch(FakeEmbedder(), min_score=0.55)
    hits = search("I want to return this")
    assert hits[0]["id"] == "H-2"
    assert all(h["score"] >= 0.55 for h in hits)
    # H-2 mentions returns AND delivery, so its cosine with a pure "return" query is 0.71
    assert GeminiSearch(FakeEmbedder(), min_score=0.99)("I want to return this") == []
