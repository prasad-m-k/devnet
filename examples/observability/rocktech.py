"""RockTech's tools: plain Python, no model calls. Invented data."""
ORDERS = {
    "4471": {"customer": "C-101", "item": "Wireless speaker", "total": 59.0, "status": "shipped"},
    "6012": {"customer": "C-101", "item": "Phone charger", "total": 30.0, "status": "delivered"},
    "5520": {"customer": "C-101", "item": "Laptop", "total": 899.0, "status": "delivered"},
    "7300": {"customer": "C-202", "item": "Monitor", "total": 240.0, "status": "delivered"},
}
REASONS = ["damaged", "late", "not_as_described", "changed_mind"]
PAID = {}                                   # idempotency key -> amount refunded

def order_lookup(order_id, customer="C-101"):
    order = ORDERS.get(str(order_id).strip())
    if order is None or order["customer"] != customer:
        return {"error": f"No order {order_id} on this account"}
    return {"order_id": str(order_id).strip(), "item": order["item"], "status": order["status"], "total": order["total"]}

def refund_process(order_id, amount, reason, customer="C-101"):
    order = ORDERS.get(str(order_id))
    if order is None or order["customer"] != customer:
        return {"error": f"No order {order_id} on this account"}
    if isinstance(amount, bool) or not isinstance(amount, (int, float)) or not 0 < amount <= order["total"]:
        return {"error": f"amount must be a number between 0 and {order['total']}"}
    if reason not in REASONS:
        return {"error": f"reason must be one of {REASONS}"}
    if amount > 50:                         # the $50 rule lives in code
        return {"status": "needs_approval", "order_id": order_id, "amount": amount}
    key = f"refund-{order_id}"
    PAID.setdefault(key, amount)            # a repeat with the same key pays nothing more
    return {"status": "refunded", "order_id": order_id, "amount": PAID[key], "key": key}
