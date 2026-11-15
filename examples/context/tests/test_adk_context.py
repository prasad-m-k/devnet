from google.adk.models.llm_request import LlmRequest
from google.genai import types
from my_agent.agent import INSTRUCTION, add_documents, root_agent, start_session_state

def test_state_fills_the_instruction_keys():
    state = start_session_state("C-101", "Asha")
    assert "{user:name?}" in INSTRUCTION and "Order 4471" in state["user:facts"]

def test_callback_adds_matching_documents():
    req = LlmRequest(contents=[types.Content(role="user", parts=[types.Part(text="Can I return the faulty speaker?")])],
                     config=types.GenerateContentConfig(system_instruction="base"))
    assert add_documents(callback_context=None, llm_request=req) is None
    assert 'id="H-2"' in req.config.system_instruction and req.config.system_instruction.startswith("base")
    assert root_agent.before_model_callback is add_documents
