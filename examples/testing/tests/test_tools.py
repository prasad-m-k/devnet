import pytest
from rocktech import order_lookup, refund_process, PAID

def test_lookup_finds_the_customers_order():
    assert order_lookup("4471") == {"order_id": "4471", "item": "Wireless speaker", "status": "shipped", "total": 59.0}

def test_lookup_trims_spaces():
    assert order_lookup(" 4471 ")["status"] == "shipped"

def test_lookup_hides_other_customers_orders():
    assert "error" in order_lookup("7300")          # 7300 belongs to C-202

def test_small_refund_is_paid():
    assert refund_process("6012", 30, "damaged")["status"] == "refunded"

def test_refund_over_50_needs_a_person():
    result = refund_process("5520", 899, "damaged")
    assert result["status"] == "needs_approval"
    assert PAID == {}                                # and no money moved

@pytest.mark.parametrize("amount", [0, -5, 31, "thirty", None, True])
def test_bad_amounts_are_refused(amount):
    assert "error" in refund_process("6012", amount, "damaged")

def test_unknown_reason_is_refused():
    assert "error" in refund_process("6012", 10, "because")

def test_repeated_refund_pays_once():
    refund_process("6012", 30, "damaged")
    refund_process("6012", 30, "damaged")            # a retry after a timeout
    assert PAID == {"refund-6012": 30}
