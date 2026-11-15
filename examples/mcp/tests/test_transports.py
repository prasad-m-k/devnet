"""The same server over stdio (a subprocess) and over HTTP."""
import asyncio, os, socket, subprocess, sys, time
from mcp import Client, StdioServerParameters

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

async def names(target):
    async with Client(target) as mcp:
        return sorted(t.name for t in (await mcp.list_tools()).tools)

def test_stdio():
    params = StdioServerParameters(command=sys.executable, args=[os.path.join(HERE, "server.py")], cwd=HERE)
    assert asyncio.run(names(params)) == ["order_lookup", "refund_process"]

def test_streamable_http():
    proc = subprocess.Popen([sys.executable, "server.py", "http"], cwd=HERE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):                               # wait up to 10 s for the port
            try:
                socket.create_connection(("127.0.0.1", 8000), timeout=0.2).close()
                break
            except OSError:
                time.sleep(0.2)
        assert asyncio.run(names("http://127.0.0.1:8000/mcp")) == ["order_lookup", "refund_process"]
    finally:
        proc.terminate()
        proc.wait(timeout=10)
