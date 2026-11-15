"""Start the server as a subprocess, list its tools, call one, read a resource."""
import asyncio, sys
from mcp import Client, StdioServerParameters

SERVER = StdioServerParameters(command=sys.executable, args=["server.py"])

async def main():
    async with Client(SERVER) as mcp:
        tools = await mcp.list_tools()
        for t in tools.tools:
            print(t.name, "-", t.description.splitlines()[0])
        result = await mcp.call_tool("order_lookup", {"order_id": "4471"})
        print("is_error:", result.is_error, "|", result.content[0].text)
        article = await mcp.read_resource("rocktech://help/H-6")
        print(article.contents[0].text)

asyncio.run(main())
