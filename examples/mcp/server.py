"""RockTech's MCP server: the order tools and help articles, for any MCP client.
Run it with:  python server.py          (stdio: a client starts it as a subprocess)
         or:  python server.py http     (Streamable HTTP on http://127.0.0.1:8000/mcp)"""
import os, sys
from mcp.server.mcpserver import MCPServer
from mcp.types import ToolAnnotations
import rocktech

# Who is signed in. A real server takes this from the client's login (OAuth), never from the model.
CUSTOMER = os.environ.get("ROCKTECH_CUSTOMER", "C-101")

HELP = {   # invented help-centre articles
    "H-2": "Returns: electronics can be returned within 14 days of delivery if unused or faulty.",
    "H-4": "Warranty: laptops and speakers have a one-year warranty against faults.",
    "H-6": "Refunds: refunds up to $50 are automatic; larger refunds need a colleague's approval. Money arrives in 3 to 5 working days.",
}

server = MCPServer("rocktech", instructions="RockTech order tools. Order facts must come from order_lookup.")

@server.tool(annotations=ToolAnnotations(read_only_hint=True))
def order_lookup(order_id: str) -> dict:
    """Look up one of the signed-in customer's orders by its number: item, status and total.

    Args:
        order_id: The order number, for example "4471".
    """
    return rocktech.order_lookup(order_id, CUSTOMER)

@server.tool(annotations=ToolAnnotations(read_only_hint=False, destructive_hint=True, idempotent_hint=True))
def refund_process(order_id: str, amount: float, reason: str) -> dict:
    """Refund part or all of one of the signed-in customer's orders. Over $50 goes to a person.

    Args:
        order_id: The order number.
        amount: Amount in USD.
        reason: One of damaged, late, not_as_described, changed_mind.
    """
    return rocktech.refund_process(order_id, amount, reason, CUSTOMER)

@server.resource("rocktech://help/{article_id}", mime_type="text/plain")
def help_article(article_id: str) -> str:
    """One RockTech help-centre article, by id (H-2, H-4, H-6)."""
    return HELP.get(article_id, f"No article {article_id}")

if __name__ == "__main__":
    if sys.argv[1:] == ["http"]:
        server.run("streamable-http", host="127.0.0.1", port=8000)
    else:
        server.run()                      # stdio
