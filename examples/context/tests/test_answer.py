from fakes import FakeClient, text_reply
from answer import HANDOFF, answer

def test_cited_answer_is_accepted():
    fake = FakeClient(text_reply("Yes, within 14 days of delivery [H-2]."))
    reply, ctx = answer(fake, "C-101", "Can I return my speaker?")
    assert reply.endswith("[H-2].")
    assert fake.models.calls[0]["config"].system_instruction == ctx.system

def test_uncited_answer_gets_one_retry():
    fake = FakeClient(text_reply("Yes, within 30 days."), text_reply("Yes, within 14 days of delivery [H-2]."))
    reply, _ = answer(fake, "C-101", "Can I return my speaker?")
    assert "[H-2]" in reply and len(fake.models.calls) == 2
    assert "only these: H-2" in fake.models.calls[1]["contents"][-1].parts[0].text

def test_invented_citation_twice_hands_off():
    fake = FakeClient(text_reply("See [H-9]."), text_reply("See [H-9] again."))
    assert answer(fake, "C-101", "Can I return my speaker?")[0] == HANDOFF

def test_no_documents_and_honest_handoff_is_fine():
    fake = FakeClient(text_reply("I'll ask a colleague about garden furniture."))
    reply, ctx = answer(fake, "C-101", "Do you sell garden furniture?")
    assert ctx.doc_ids == [] and "colleague" in reply
