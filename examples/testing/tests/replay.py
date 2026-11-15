"""Record real replies once, then replay them in free tests."""
import json, pathlib
from google.genai import types

class Recorder:
    """Wraps a real client and saves every reply to a .jsonl file."""
    def __init__(self, client, path):
        self.client, self.path = client, pathlib.Path(path)
        self.models = self

    def generate_content(self, **kwargs):
        reply = self.client.models.generate_content(**kwargs)
        with self.path.open("a") as f:
            f.write(reply.model_dump_json(exclude_none=True) + "\n")
        return reply

def load_replies(path):
    return [types.GenerateContentResponse.model_validate_json(line)
            for line in pathlib.Path(path).read_text().splitlines() if line.strip()]
