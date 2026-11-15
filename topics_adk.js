/* Agentic AI Reference: Gemini ADK (Agent Development Kit) topics. Same shape as topics_gemini.js.
   Checked against adk.dev on 2026-11-14. ADK changes quickly: re-check commands when you edit. */

REF.add({
  id: "adk",
  name: "Gemini ADK",
  blurb: "Google's Agent Development Kit: a framework that runs the agent loop, sessions, multi-agent handoffs and deployment for you. Builds on the Gemini topics.",
  sections: [
    ["Get started", "Decide if you need ADK, install it, connect it to Gemini and run your first agent."],
    ["Build agents", "Tools, several agents working together, and running an agent from your own code."],
    ["Deploy", "Put your agent on Google Cloud so other people and systems can call it."]
  ],
  topics: [

{ id: "why-adk", section: "Get started", title: "ADK or your own loop?", labs: [],
  concepts: ["agent", "agent-loop", "multi-agent", "workflow"],
  summary: "What ADK does for you, what it hides, and when the hand-written loop is still the better choice.",
  blocks: [
    { p: "The Gemini topics build an agent by hand: call the model, check <code>function_calls</code>, run the tool, send the result back, repeat. That is about 30 lines and you see every step. ADK is Google's open-source framework that does those steps for you, and adds the parts that take much longer to write well." },
    { table: [["You need", "Hand-written loop", "ADK"],
      ["One agent, a few tools", "Simple and clear", "Works, slightly more setup"],
      ["Chat history across turns", "You keep the list", "Sessions do it"],
      ["Several agents handing off", "You write the routing", "<code>sub_agents</code>, Sequential, Parallel"],
      ["A test UI with traces", "Print statements", "<code>adk web</code>"],
      ["Deploy as a web service", "Write your own server", "<code>adk deploy</code>"]] },
    { tip: "Learn the loop by hand first (<a href=\"#gemini-agent-loop\">Build the agent loop</a>). When ADK does something you didn't expect, you'll know what it is doing underneath." },
    { watch: "A framework hides the prompt and the history it sends. When answers go wrong, open the trace in <code>adk web</code> and read exactly what the model saw." },
    { p: "ADK also has TypeScript, Go and Java versions with the same ideas. These pages use Python.", adv: true }
  ],
  docs: [["ADK documentation", "https://adk.dev/"], ["Python quickstart", "https://adk.dev/get-started/python/"]],
  apis: [["google-adk", "The Python package for ADK."]] },

{ id: "install", section: "Get started", title: "Install ADK and create a project", labs: [],
  concepts: ["sdk", "agent-framework"],
  summary: "Make a virtual environment, install google-adk and let the CLI create the project files.",
  blocks: [
    { p: "ADK needs Python 3.10 or later. It runs on your own computer (Mac, Windows or Linux), which is where its development tools work best." },
    { h: "Install" },
    { steps: ["Open a terminal in an empty folder.", "Create and turn on a virtual environment, so ADK's packages stay separate from the rest of your system.", "Install ADK."] },
    { code: py`python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate.bat
pip install google-adk`, lang: "Terminal" },
    { h: "Create the project" },
    { code: py`adk create my_agent`, lang: "Terminal" },
    { out: "my_agent/\n    agent.py      # the agent\n    .env          # your API key or Google Cloud project\n    __init__.py   # contains: from . import agent" },
    { p: "ADK finds your agent by looking for a variable called <code>root_agent</code> in <code>agent.py</code>. Keep that name." },
    { watch: "<b>command not found: adk</b> means the virtual environment is not turned on in this terminal. Run the <code>source .venv/bin/activate</code> line again." },
    { watch: "Never commit <code>.env</code> to git. Add it to <code>.gitignore</code> before your first commit." },
    { p: "A newer scaffolding tool, the Agents CLI (<code>uvx google-agents-cli setup</code>), creates a project with deployment pipelines already set up. It needs Python 3.11, Node.js and uv. Start with <code>adk create</code>; move to the Agents CLI when you need CI/CD.", adv: true }
  ],
  docs: [["Python quickstart", "https://adk.dev/get-started/python/"], ["Agents CLI quickstart", "https://adk.dev/get-started/agents-cli/"]],
  apis: [["pip install google-adk", "Install ADK."], ["adk create <name>", "Create an agent project."], ["root_agent", "The variable ADK looks for in agent.py."]] },

{ id: "connect", section: "Get started", title: "Connect ADK to Gemini", labs: [],
  concepts: ["api-key", "cloud-project", "adc"],
  summary: "Point ADK at Gemini with an API key, or at your Google Cloud project.",
  blocks: [
    { p: "ADK reads its connection settings from <code>my_agent/.env</code>. Choose one of the two options below, not both." },
    { h: "Option 1: an API key (quickest)" },
    { p: "Use the same key as in <a href=\"#gemini-access\">Get access (API key)</a>." },
    { code: py`GOOGLE_API_KEY="PASTE_YOUR_GEMINI_API_KEY_HERE"`, lang: "my_agent/.env" },
    { h: "Option 2: your Google Cloud project" },
    { p: "Use this when your company works in Google Cloud, needs data to stay in a region, or wants billing and access on the cloud account. First sign in from your computer (see <a href=\"#gcp-auth\">Sign in from code</a>):" },
    { code: py`gcloud auth application-default login`, lang: "Terminal" },
    { code: py`GOOGLE_GENAI_USE_ENTERPRISE=TRUE
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1`, lang: "my_agent/.env" },
    { watch: "<code>GOOGLE_GENAI_USE_ENTERPRISE</code> replaced the older <code>GOOGLE_GENAI_USE_VERTEXAI</code>. If the agent cannot connect, you may have an older ADK: update it (<code>pip install -U google-adk</code>) or use the older name." },
    { watch: "The project needs the Agent Platform API switched on and your account needs permission to use it. See <a href=\"#gcp-apis\">Turn on the APIs you need</a> and <a href=\"#gcp-iam\">Give access with IAM roles</a>." },
    { p: "Google Cloud also offers an \"express mode\" API key for quick tests: <code>GOOGLE_GENAI_USE_ENTERPRISE=TRUE</code> plus <code>GOOGLE_GENAI_API_KEY=...</code>. For production, use a service account instead of any key.", adv: true }
  ],
  docs: [["Connect to Google Cloud and Agent Platform", "https://adk.dev/get-started/google-cloud/"]],
  apis: [["GOOGLE_API_KEY", "Gemini API key for ADK."], ["GOOGLE_GENAI_USE_ENTERPRISE", "Use Google Cloud instead of an API key."], ["GOOGLE_CLOUD_PROJECT / GOOGLE_CLOUD_LOCATION", "Which project and region to use."]] },

{ id: "first-agent", section: "Get started", title: "Build your first agent", labs: [],
  concepts: ["agent", "tool-calling", "system-prompt"],
  summary: "An agent is a model, an instruction and a list of plain Python functions it may call.",
  blocks: [
    { p: "In ADK you don't write tool schemas. You write an ordinary Python function with type hints and a docstring, and ADK turns it into the description the model sees (compare <a href=\"#gemini-define-tool\">Describe a tool</a>)." },
    { code: py`from google.adk.agents import Agent

def order_lookup(order_id: str) -> dict:
    """Look up one RockTech order by its number, for status, delivery and tracking.

    Args:
        order_id: The order number, for example "4471".
    """
    orders = {"4471": {"item": "Wireless speaker", "status": "shipped", "arriving": "2 November"}}
    return orders.get(order_id, {"error": f"No order {order_id} on this account"})

root_agent = Agent(
    name="rocktech_support",
    model="gemini-flash-latest",
    description="Answers RockTech customers' questions about their orders.",
    instruction="You are RockTech's support assistant. Use order_lookup for any fact about an order; never guess. Be brief.",
    tools=[order_lookup],
)`, lang: "my_agent/agent.py" },
    { table: [["Argument", "What it is for"],
      ["name", "An id for the agent. Letters, digits and underscores."],
      ["model", "Which Gemini model. See <a href=\"#gemini-models\">Choose a model</a>."],
      ["description", "One line other agents read to decide whether to hand work to this one."],
      ["instruction", "The system instruction: role, rules, tone."],
      ["tools", "Python functions the model may ask to run."]] },
    { tip: "The docstring is the tool's description. Say when to use the tool and what the argument looks like, exactly as you would in a schema." },
    { watch: "Return a dict, including for errors. An exception inside a tool stops the turn; an <code>{\"error\": ...}</code> lets the model explain the problem to the customer." },
    { p: "<code>Agent</code> is the short name for <code>LlmAgent</code>. Other settings include <code>generate_content_config</code> (a <code>types.GenerateContentConfig</code> for temperature and output limits) and <code>output_key</code> (save the reply into session state, see <a href=\"#adk-multi-agent\">Make agents work together</a>).", adv: true }
  ],
  docs: [["Build a multi-tool agent", "https://adk.dev/tutorials/multi-tool-agent/"]],
  apis: [["Agent(name, model, description, instruction, tools)", "Define an agent (alias of LlmAgent)."], ["Function tool", "A Python function with type hints and a docstring."]] },

{ id: "run", section: "Get started", title: "Run and debug your agent", labs: [],
  concepts: ["observability", "agent-loop"],
  summary: "Chat in the terminal, open the web UI to see every step, or start a local API server.",
  blocks: [
    { p: "Run these from the folder that <em>contains</em> <code>my_agent/</code>, not from inside it." },
    { h: "In the terminal" },
    { code: py`adk run my_agent`, lang: "Terminal" },
    { h: "In the browser, with traces" },
    { code: py`adk web --port 8000`, lang: "Terminal" },
    { steps: ["Open http://localhost:8000.", "Pick <b>my_agent</b> from the list at the top.", "Type \"Where is order 4471?\".", "Open the events for that turn: you see the model's tool call, your function's result and the final answer."] },
    { out: "Your order 4471, the wireless speaker, has shipped and should arrive on 2 November." },
    { watch: "<code>adk web</code> is for development only. Don't expose it on the internet." },
    { h: "As an API", adv: true },
    { code: py`adk api_server`, lang: "Terminal", adv: true },
    { p: "This starts a local web server with the same endpoints a deployed agent has, so you can test a front end or another service against it. Piping text into <code>adk run</code> also works for quick scripts: <code>echo \"Where is order 4471?\" | adk run my_agent</code>.", adv: true }
  ],
  docs: [["Python quickstart: run your agent", "https://adk.dev/get-started/python/"]],
  apis: [["adk run <agent>", "Chat in the terminal."], ["adk web", "Development UI with traces."], ["adk api_server", "Local API server."]] },

/* ================= Build agents ================= */
{ id: "tools", section: "Build agents", title: "Give the agent more tools", labs: [],
  concepts: ["tool-calling", "tool-schema", "least-privilege", "guardrail"],
  summary: "Add several tools, keep money rules in code, and know which built-in tools exist.",
  blocks: [
    { p: "Add functions to the list. The model chooses between them from their docstrings." },
    { code: py`def knowledge_search(query: str) -> dict:
    """Search RockTech's help centre: products, delivery, returns and warranty.
    Not for one customer's order: use order_lookup for that.

    Args:
        query: What to look up, in a few words.
    """
    ...

def refund_process(order_id: str, amount: float, reason: str) -> dict:
    """Refund one order. Use only after order_lookup confirms the order and amount.

    Args:
        order_id: The order number.
        amount: Refund amount in USD.
        reason: One of damaged, late, not_as_described, changed_mind.
    """
    if amount > 50:                                   # the rule lives in code
        return {"status": "sent to a person for approval"}
    ...

root_agent = Agent(name="rocktech_support", model="gemini-flash-latest",
                   instruction=SYSTEM, tools=[order_lookup, knowledge_search, refund_process])`, lang: "my_agent/agent.py" },
    { watch: "ADK runs your tool as soon as the model asks. The checks that the hand-written loop did before running a tool must now live inside the tool. See <a href=\"#gemini-guard-actions\">Keep actions safe</a>." },
    { h: "Built-in and ready-made tools", adv: true },
    { p: "ADK ships tools such as <code>google_search</code> (<code>from google.adk.tools import google_search</code>) and code execution, plus integrations like the BigQuery toolset. Some built-in tools have limits on being combined with other tools in the same agent; check the tools page before mixing them. <code>AgentTool</code> wraps a whole agent so another agent can call it like a function.", adv: true },
    { p: "To let a tool read session state, add a parameter <code>tool_context: ToolContext</code> (from <code>google.adk.tools</code>); ADK fills it in and leaves it out of the schema the model sees. <code>tool_context.state</code> is a dict for this conversation.", adv: true }
  ],
  docs: [["ADK tools", "https://adk.dev/tools/"]],
  apis: [["tools=[fn, ...]", "Functions the agent may call."], ["google_search", "Built-in Google Search tool."], ["ToolContext", "Gives a tool access to session state."]] },

{ id: "multi-agent", section: "Build agents", title: "Make agents work together", labs: [],
  concepts: ["multi-agent", "supervisor-worker", "prompt-chaining", "model-routing", "workflow"],
  summary: "A coordinator that hands off to specialists, a fixed pipeline, and agents running side by side.",
  blocks: [
    { h: "A coordinator with specialists" },
    { p: "List agents in <code>sub_agents</code>. The coordinator reads each one's <code>description</code> and hands the conversation to the right one." },
    { code: py`orders_agent = Agent(name="orders", model=MODEL, tools=[order_lookup, refund_process],
    description="Handles anything about one customer's order: status, delivery, refunds.",
    instruction="You handle RockTech orders. Use the tools; never guess.")

policy_agent = Agent(name="policy", model=MODEL, tools=[knowledge_search],
    description="Answers general questions about products, delivery, returns and warranty.",
    instruction="You answer RockTech policy questions from the help centre only.")

root_agent = Agent(name="support", model=MODEL,
    instruction="Greet the customer and pass them to the right specialist.",
    sub_agents=[orders_agent, policy_agent])` },
    { tip: "Descriptions decide the routing, the same way tool docstrings decide tool choice. Make them specific and non-overlapping." },
    { h: "A fixed pipeline: SequentialAgent" },
    { p: "When the steps are always the same, don't let a model decide the order. <code>output_key</code> saves one agent's reply into session state, and the next agent's instruction can read it with <code>{draft}</code>." },
    { code: py`from google.adk.agents import Agent, SequentialAgent

draft = Agent(name="draft", model=MODEL, output_key="draft",
    instruction="Draft a kind reply to the customer's complaint, under 120 words. Promise nothing about refunds.")
review = Agent(name="review", model=MODEL,
    instruction="Review this draft reply: {draft}. If it is unkind or promises money, rewrite it. Return only the reply.")

root_agent = SequentialAgent(name="complaint_pipeline", sub_agents=[draft, review])` },
    { h: "Side by side: ParallelAgent", adv: true },
    { p: "Runs sub-agents at the same time. They don't see each other, so give each an <code>output_key</code> and add a final agent that combines them.", adv: true },
    { code: py`from google.adk.agents import ParallelAgent

checks = ParallelAgent(name="checks", sub_agents=[order_check, policy_check])   # each sets an output_key
root_agent = SequentialAgent(name="answer", sub_agents=[checks, writer])        # writer reads both keys`, adv: true },
    { watch: "A gate that must always hold, like escalating a legal threat, belongs in code or in a fixed pipeline step, not only in a coordinator's instruction.", adv: true }
  ],
  docs: [["Multi-agent systems", "https://adk.dev/agents/multi-agents"], ["Parallel agents", "https://adk.dev/agents/workflow-agents/parallel-agents/"], ["Multi-agent patterns (Google blog)", "https://developers.googleblog.com/developers-guide-to-multi-agent-patterns-in-adk/"]],
  apis: [["sub_agents=[...]", "Agents this one can hand off to."], ["SequentialAgent", "Run sub-agents in order."], ["ParallelAgent", "Run sub-agents at the same time."], ["output_key", "Save the reply into session state."]] },

{ id: "runner", section: "Build agents", title: "Run an agent from your own code", labs: [],
  concepts: ["state", "short-term-memory", "messages"],
  summary: "Use a Runner and a session service to call your agent from a script, a notebook or your own app.",
  blocks: [
    { p: "<code>adk run</code> and <code>adk web</code> are tools for you. Your own program talks to the agent through a <b>Runner</b>. A <b>session</b> holds one conversation's history and state, so the second question can rely on the first." },
    { code: py`import asyncio
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from my_agent.agent import root_agent

APP, USER, SESSION = "rocktech", "asha", "chat-1"
sessions = InMemorySessionService()
runner = Runner(agent=root_agent, app_name=APP, session_service=sessions)

async def ask(text):
    message = types.Content(role="user", parts=[types.Part(text=text)])
    async for event in runner.run_async(user_id=USER, session_id=SESSION, new_message=message):
        if event.is_final_response() and event.content and event.content.parts:
            return event.content.parts[0].text

async def main():
    await sessions.create_session(app_name=APP, user_id=USER, session_id=SESSION)
    print(await ask("Where is order 4471?"))
    print(await ask("And what did I order?"))      # same session: it remembers

asyncio.run(main())` },
    { watch: "In Colab or Jupyter an event loop is already running, so <code>asyncio.run</code> fails. Write <code>await main()</code> in the cell instead." },
    { watch: "<code>InMemorySessionService</code> forgets everything when the program stops. Fine for tests; for real users, use a database-backed or Google Cloud session service." },
    { p: "Each event is one step: a model reply, a tool call, a tool result. Printing every event, not only the final one, gives you the same trace as <code>adk web</code>. <code>InMemoryRunner(agent=root_agent, app_name=APP)</code> bundles the in-memory services in one line.", adv: true }
  ],
  docs: [["Sessions, state and memory", "https://adk.dev/sessions/"]],
  apis: [["Runner(agent, app_name, session_service)", "Runs an agent for your code."], ["InMemorySessionService", "Keeps sessions in memory."], ["runner.run_async(user_id, session_id, new_message)", "Send a message, get events."], ["event.is_final_response()", "True on the answer to show."]] },

/* ================= Deploy ================= */
{ id: "deploy", section: "Deploy", title: "Deploy your agent to Google Cloud", labs: [],
  concepts: ["cloud-project", "service-account", "least-privilege", "latency"],
  summary: "One command builds your agent into a container and runs it on Cloud Run. Agent Runtime is the managed alternative.",
  blocks: [
    { p: "Your project needs <code>agent.py</code> (with <code>root_agent</code>), <code>__init__.py</code> and a <code>requirements.txt</code> listing your packages. You also need a Google Cloud project with billing (see <a href=\"#gcp-project\">Set up a project</a>)." },
    { h: "Before the first deploy" },
    { code: py`gcloud auth login
gcloud config set project your-project-id`, lang: "Terminal" },
    { p: "Let Cloud Build use your project's default compute account (replace the project id and number):" },
    { code: py`gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/cloudbuild.builds.builder"`, lang: "Terminal" },
    { h: "Deploy to Cloud Run" },
    { code: py`export GOOGLE_CLOUD_PROJECT=your-project-id
export GOOGLE_CLOUD_LOCATION=us-central1
export GOOGLE_GENAI_USE_ENTERPRISE=True

adk deploy cloud_run \
  --project=$GOOGLE_CLOUD_PROJECT \
  --region=$GOOGLE_CLOUD_LOCATION \
  --service_name=rocktech-agent \
  --app_name=rocktech \
  ./my_agent`, lang: "Terminal" },
    { out: "A Cloud Run service URL. Only the API server is deployed unless you add --with_ui." },
    { watch: "Without <code>--session_service_uri</code> and <code>--artifact_service_uri</code>, conversations are lost whenever Cloud Run restarts an instance. Set them for anything real." },
    { watch: "<code>--with_ui</code> deploys the development web UI too. Keep it off for anything public." },
    { tip: "If the agent uses an API key instead of Google Cloud sign-in, store the key in Secret Manager and give the service account <code>roles/secretmanager.secretAccessor</code>. See <a href=\"#gcp-secrets\">Keep keys in Secret Manager</a>." },
    { h: "Agent Runtime", adv: true },
    { p: "Agent Runtime (part of Google Cloud's Agent Platform, formerly Vertex AI Agent Engine) is a managed service built for agents: it provides the API server, sessions and scaling. Deploy with <code>adk deploy</code> to Agent Runtime, or use the Agents CLI for a full setup with CI/CD and infrastructure as code. Follow the current ADK deploy guide for the exact flags.", adv: true },
    { p: "For a custom server, <code>get_fast_api_app()</code> builds a FastAPI app around your agent; deploy it with your own Dockerfile and <code>gcloud run deploy --source .</code>.", adv: true }
  ],
  docs: [["Deploy to Cloud Run", "https://adk.dev/deploy/cloud-run/"], ["Deploy to Agent Runtime", "https://adk.dev/deploy/agent-runtime/deploy/"], ["Codelab: deploy, manage and observe on Cloud Run", "https://codelabs.developers.google.com/deploy-manage-observe-adk-cloud-run"]],
  apis: [["adk deploy cloud_run", "Build and deploy to Cloud Run."], ["--session_service_uri", "Where sessions are stored after deploy."], ["get_fast_api_app()", "Wrap the agent in your own FastAPI app."]] }

  ]
});
