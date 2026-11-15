import asyncio
from my_agent.agent import root_agent, rocktech_tools

def test_toolset_loads_only_the_allowed_tool():
    async def load():
        try:
            return [t.name for t in await rocktech_tools.get_tools()]
        finally:
            await rocktech_tools.close()
    assert asyncio.run(load()) == ["order_lookup"]
    assert rocktech_tools in root_agent.tools
