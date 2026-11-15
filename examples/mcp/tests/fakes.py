"""A pretend Gemini client. It returns real google-genai response objects,
so the code under test reads them exactly as it reads Google's."""
from google.genai import types

def usage(prompt=120, reply=20, thoughts=None):
    return types.GenerateContentResponseUsageMetadata(
        prompt_token_count=prompt, candidates_token_count=reply, thoughts_token_count=thoughts)

def text_reply(text, **u):
    return types.GenerateContentResponse(
        candidates=[types.Candidate(content=types.Content(role="model", parts=[types.Part(text=text)]),
                                    finish_reason="STOP")],
        usage_metadata=usage(**u))

def tool_reply(name, **args):
    return types.GenerateContentResponse(
        candidates=[types.Candidate(content=types.Content(role="model",
                    parts=[types.Part.from_function_call(name=name, args=args)]), finish_reason="STOP")],
        usage_metadata=usage())

class FakeModels:
    def __init__(self, replies):
        self.replies = list(replies)
        self.calls = []                       # what the code sent, for the test to check

    def generate_content(self, *, model, contents, config=None):
        self.calls.append({"model": model, "contents": list(contents) if isinstance(contents, list) else contents,
                           "config": config})
        if not self.replies:
            raise AssertionError("the code called the model more times than the test expected")
        reply = self.replies.pop(0)
        if isinstance(reply, Exception):
            raise reply
        return reply

class AsyncFakeModels(FakeModels):
    async def generate_content(self, **kwargs):
        return FakeModels.generate_content(self, **kwargs)

class FakeClient:
    """client.models.generate_content and client.aio.models.generate_content both play the script."""
    def __init__(self, *replies):
        self.models = FakeModels(replies)
        self.aio = type("Aio", (), {})()
        self.aio.models = AsyncFakeModels([])
        self.aio.models.replies = self.models.replies      # one shared script
        self.aio.models.calls = self.models.calls
