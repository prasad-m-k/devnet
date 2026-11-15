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

# ---------- customers and help articles (invented)
PROFILES = {
    "C-101": {"name": "Asha", "tier": "standard", "prefers": "email", "open_ticket": "T-001: speaker 4471 arrived late"},
    "C-202": {"name": "Ravi", "tier": "plus", "prefers": "phone", "open_ticket": None},
}

HELP = [
    {"id": "H-1", "title": "Late deliveries", "text": "If an order is two or more days late, we can reship it or refund it."},
    {"id": "H-2", "title": "Returns", "text": "Electronics can be returned within 14 days of delivery if unused or faulty."},
    {"id": "H-3", "title": "X200 headphones", "text": "If X200 headphones cut out, update the firmware and re-pair them."},
    {"id": "H-4", "title": "Warranty", "text": "Laptops and speakers have a one-year warranty against faults."},
    {"id": "H-5", "title": "Delivery days", "text": "We deliver Monday to Saturday. There are no Sunday deliveries."},
    {"id": "H-6", "title": "Refunds", "text": "Refunds up to $50 are automatic; larger refunds need a colleague's approval. Money arrives in 3 to 5 working days."},
]

def customer_orders(customer):
    return [{"order_id": oid, **{k: o[k] for k in ("item", "status", "total")}}
            for oid, o in ORDERS.items() if o["customer"] == customer]
