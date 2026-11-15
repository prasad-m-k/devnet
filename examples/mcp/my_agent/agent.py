"""An ADK agent whose tools come from RockTech's MCP server."""
import os, sys
from google.adk.agents import Agent
from google.adk.tools.mcp_tool import McpToolset, StdioConnectionParams
from mcp import StdioServerParameters

SERVER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "server.py")

rocktech_tools = McpToolset(
    connection_params=StdioConnectionParams(
        server_params=StdioServerParameters(command=sys.executable, args=[SERVER]),
        timeout=10),
    tool_filter=["order_lookup"],            # this agent may look orders up, not refund them
)

root_agent = Agent(
    name="rocktech_support",
    model="gemini-flash-latest",
    description="Answers RockTech customers' questions about their orders.",
    instruction="You are RockTech's support assistant. Use order_lookup for any fact about an order; never guess. Be brief.",
    tools=[rocktech_tools],
)
