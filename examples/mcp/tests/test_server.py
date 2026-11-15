"""Test the server in-process: Client(server) needs no subprocess and no network."""
import asyncio
from mcp import Client
import rocktech
from server import server

def run(coro):
    return asyncio.run(coro)

async def tools():
    async with Client(server) as mcp:
        return {t.name: t for t in (await mcp.list_tools()).tools}

async def call(name, args):
    async with Client(server) as mcp:
        return await mcp.call_tool(name, args)

def test_lists_both_tools_with_schemas():
    t = run(tools())
    assert set(t) == {"order_lookup", "refund_process"}
    assert t["order_lookup"].input_schema["required"] == ["order_id"]
    assert t["order_lookup"].annotations.read_only_hint is True
    assert "Over $50" in t["refund_process"].description

def test_lookup_returns_the_order():
    r = run(call("order_lookup", {"order_id": "4471"}))
    assert not r.is_error and '"shipped"' in r.content[0].text

def test_other_customers_order_is_hidden():
    r = run(call("order_lookup", {"order_id": "7300"}))
    assert "No order 7300" in r.content[0].text

def test_big_refund_still_needs_a_person():
    r = run(call("refund_process", {"order_id": "5520", "amount": 899, "reason": "damaged"}))
    assert "needs_approval" in r.content[0].text and rocktech.PAID == {}

def test_bad_arguments_are_an_error_not_a_crash():
    r = run(call("refund_process", {"order_id": "6012"}))
    assert r.is_error

def test_help_article_resource():
    async def read():
        async with Client(server) as mcp:
            return (await mcp.read_resource("rocktech://help/H-6")).contents[0].text
    assert "$50" in run(read())
