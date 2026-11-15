from context import RULES, build_context, check_citations, fit_history, keyword_search, live_facts

def test_live_facts_cover_only_this_customer():
    facts = live_facts("C-101")
    assert "Asha" in facts and "Order 4471" in facts and "T-001" in facts
    assert "7300" not in facts                         # Ravi's monitor

def test_search_finds_the_returns_article():
    hits = keyword_search("Can I return the speaker? It's faulty")
    assert hits[0]["id"] == "H-2"

def test_word_forms_match():
    assert keyword_search("returning a laptop")[0]["id"] == "H-2"      # returning ~ Returns, returned

def test_search_returns_nothing_rather_than_a_bad_match():
    assert keyword_search("Do you sell garden furniture?") == []

def test_history_keeps_newest_turns():
    history = [{"role": "user", "text": "x" * 400}, {"role": "model", "text": "y" * 400}, {"role": "user", "text": "z" * 40}]
    kept, dropped, used = fit_history(history, budget=120)
    assert [t["text"][0] for t in kept] == ["y", "z"] and dropped == 1

def test_context_order_and_contents():
    ctx = build_context("C-101", "Can I return my speaker? It's faulty")
    assert ctx.system.startswith(RULES)
    assert ctx.system.index("FACTS") < ctx.system.index("DOCUMENTS")
    assert 'id="H-2"' in ctx.system and ctx.doc_ids[0] == "H-2"
    assert ctx.contents[-1].parts[0].text == "Can I return my speaker? It's faulty"   # question last

def test_documents_respect_the_budget():
    tight = {"facts": 300, "documents": 40, "history": 800}
    ctx = build_context("C-101", "refund return warranty delivery late", budget=tight)
    assert len(ctx.doc_ids) == 1
    assert any(note == "dropped: over budget" for _, _, note in ctx.report)

def test_old_history_is_replaced_by_summary():
    history = [{"role": "user" if i % 2 == 0 else "model", "text": "word " * 200} for i in range(10)]
    ctx = build_context("C-101", "And the refund?", history, summary="Asha asked about speaker 4471 arriving late.")
    assert "EARLIER IN THIS CONVERSATION" in ctx.system
    assert len(ctx.contents) < 11

def test_citations():
    assert check_citations("You can return it within 14 days [H-2].", ["H-2", "H-6"])["ok"]
    assert not check_citations("You can return it within 30 days.", ["H-2"])["ok"]          # no citation
    bad = check_citations("See [H-9].", ["H-2"])
    assert not bad["ok"] and bad["unknown"] == ["H-9"]
