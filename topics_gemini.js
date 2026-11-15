/* Gemini Lab Reference: Gemini topics.

   The left pane is built from SECTIONS and TOPICS below. To add a topic, copy one and edit it.
   Topic fields:
     id       unique, lowercase-with-hyphens (it becomes the link: #gemini-<id>)
     section  one of SECTIONS (where it sits in the tree)
     title    the task, in plain words: "Choose a model", not "client.models.list"
     summary  one sentence under the title
     labs     lab notebooks that use it, e.g. [1, 3]
     blocks   the page, top to bottom. Block types:
       { h: "Heading" }                 a section heading (also listed in "On this page")
       { p: "html" }                    a paragraph
       { steps: ["html", ...] }         numbered steps
       { code: py`...`, label: "..." }  Python with a Copy button; label defaults to "Python"
       { out: "text" }                  what you should see when you run it
       { table: [["head", ...], [...], ...] }  first row is the header
       { tip: "html" } { watch: "html" }       callouts
     Add adv: true to any block to hide it in Essentials mode.
     apis     [["name", "what it does"], ...] listed at the end and in the A to Z index
   Then add a line to CHANGELOG in reference_core.js. */

const py = String.raw;

REF.add({
  id: "gemini",
  name: "Gemini",
  blurb: "Google's Gemini models through the google-genai Python SDK. <span class='labref'>Used in the Gemini editions of Labs 1 to 5.</span>",
  sections: [
    ["Get started", "Install, get a key, connect, pick a model.<span class='labref'> The first cells of every lab.</span>"],
    ["Talk to the model", "Send prompts, set the role, control length, get JSON, keep a conversation."],
    ["Read replies and handle errors", "Get the answer out safely and survive rate limits."],
    ["Tools and agents", "Let the model ask your code to look things up and take actions."],
    ["Search by meaning", "Embeddings, similarity search, routing and chains<span class='labref'> (Lab 2)</span>."],
    ["Memory", "Keep long chats inside the budget and remember customers between sessions<span class='labref'> (Lab 5)</span>."],
    ["Data", "The RockTech practice database the tools read and write."],
    ["Voice", "Speech in, speech out, and a full phone turn<span class='labref'> (Lab 4)</span>."]
  ],
  topics: [

/* ================= Get started ================= */
{ id: "install", concepts: ["sdk", "api"], section: "Get started", title: "Install Gemini", labs: [1, 2, 3, 4, 5],
  summary: "Put Google's Gemini library on your Colab machine and check it loaded.",
  blocks: [
    { p: "Gemini runs on Google's servers. Your notebook talks to it through a Python library called <code>google-genai</code>. The library is not part of Colab, so you install it first.<span class='labref'> The first cell of every lab does this.</span>" },
    { h: "Install the library" },
    { steps: ["Open your notebook in Colab.", "Run the first cell. <code>-q</code> keeps the install output short.", "Wait for the cell to finish (a green tick), then run the next cell."] },
    { code: py`%pip install -q google-genai`, label: "Lab 1, 3, 5" },
    { p: "Some projects need more libraries. Install them in the same cell:" },
    { code: py`%pip install -q google-genai sentence-transformers   # for embeddings
%pip install -q faster-whisper gTTS google-genai     # for voice` },
    { h: "Import it" },
    { p: "Every Gemini notebook then imports the same three names. <code>genai</code> makes the client, <code>types</code> holds the request and reply objects, <code>errors</code> holds the exceptions." },
    { code: py`from google import genai
from google.genai import types, errors` },
    { h: "Check the version", adv: true },
    { p: "The SDK changes often. Printing the version helps when code from the internet does not match the code here.", adv: true },
    { code: py`import google.genai
print(google.genai.__version__)`, label: "Not in the labs", adv: true },
    { p: "To freeze a notebook so it behaves the same next month, pin the version you tested: <code>%pip install -q google-genai==X.Y.Z</code>.", adv: true },
    { h: "If it goes wrong" },
    { watch: "<b>ModuleNotFoundError: No module named 'google.genai'</b>. The Colab machine was reset (sessions end after a while). Run the install cell again." },
    { watch: "<b>Code from a blog post fails.</b> Many posts use the older package <code>google-generativeai</code> (<code>import google.generativeai as genai</code>). It is a different library and its code does not work here. Use the code on this site or the official google-genai docs." },
    { tip: "Use <code>%pip</code>, with the percent sign. It installs into the Python your notebook is running. <code>!pip</code> can install somewhere else." , adv: true }
  ],
  apis: [["%pip install", "Install a package into the notebook's Python."], ["google-genai", "Google's Python SDK for Gemini."], ["genai, types, errors", "The three modules every Gemini notebook imports."]] },

{ id: "access", concepts: ["api-key", "api"], section: "Get started", title: "Get access (API key)", labs: [1, 2, 3, 4, 5],
  summary: "Create a Gemini API key and store it in Colab Secrets, never in the notebook.",
  blocks: [
    { p: "Google needs to know who is calling, so every request carries an API key. A key is like a password for your account: anyone who has it can use your quota. In Colab, keep it in the Secrets panel, so you can share a notebook without sharing the key." },
    { h: "Create a key" },
    { steps: ["Go to Google AI Studio (aistudio.google.com) and sign in with your Google account.", "Choose <b>Get API key</b>, then <b>Create API key</b>.", "Copy the key. Treat it like a password."] },
    { h: "Save it in Colab Secrets" },
    { steps: ["In Colab, click the key icon on the left bar (Secrets).", "Click <b>Add new secret</b>.", "Name: <code>GOOGLE_API_KEY</code>, exactly like that. Value: paste your key.", "Switch <b>Notebook access</b> on for this notebook."] },
    { h: "Read it in code" },
    { code: py`from google.colab import userdata
key = userdata.get("GOOGLE_API_KEY")` },
    { p: "The setup cell passes this straight to the client (next topic). You never see or print the key." },
    { h: "Outside Colab", adv: true },
    { p: "On your own computer there is no Secrets panel. Set an environment variable instead. If you create the client with no key, the SDK reads <code>GEMINI_API_KEY</code> or <code>GOOGLE_API_KEY</code> from the environment by itself.", adv: true },
    { code: py`# in the terminal:  export GEMINI_API_KEY="your key"
from google import genai
client = genai.Client()          # finds the key in the environment`, label: "Not in the labs", adv: true },
    { h: "If it goes wrong" },
    { watch: "<b>SecretNotFoundError</b>: the name is not exactly <code>GOOGLE_API_KEY</code>. <b>NotebookAccessError</b>: the Notebook access switch is off." },
    { watch: "<b>API key not valid</b> (error 400): the key was copied with a missing character or was deleted. Make a new one and save it again." },
    { watch: "Never paste the key into a cell, a screenshot or a chat. If you did, delete the key in AI Studio and make a new one." }
  ],
  apis: [["userdata.get(name)", "Read a Colab secret."], ["GEMINI_API_KEY / GOOGLE_API_KEY", "Environment variables the SDK checks when no key is passed."]] },

{ id: "client", concepts: ["sdk", "api", "system-prompt"], section: "Get started", title: "Set up the client", labs: [1, 2, 3, 4, 5],
  summary: "Create the one object every Gemini call goes through, and test it.",
  blocks: [
    { p: "The client holds your key and the connection to Google. You make it once in the setup cell and call it <code>client</code> for the rest of the notebook." },
    { h: "Create it" },
    { code: py`from google import genai
from google.genai import types, errors
from google.colab import userdata

client = genai.Client(api_key=userdata.get("GOOGLE_API_KEY"))`, label: "Every lab, setup cell" },
    { h: "Make a test call" },
    { p: "Four lines confirm the key, the client and the model all work. This is the shape of almost every Gemini call you will write." },
    { code: py`MODEL = "gemini-2.5-flash-lite"
config = types.GenerateContentConfig(system_instruction="You are RockTech's support assistant. Be brief.")
response = client.models.generate_content(model=MODEL, contents="Where is my order 4471?", config=config)
print(response.text)` },
    { out: "A short, polite reply. It will not know the real status of order 4471, because nothing told it. <a href='#gemini-first-call'>Send your first prompt</a> shows how to give it the facts." },
    { h: "What the client gives you" },
    { table: [["You write", "What it does", "Topic"],
      ["client.models.generate_content", "Send a request, get a reply", "<a href=\"#gemini-first-call\">Send your first prompt</a>"],
      ["client.models.count_tokens", "Count tokens without generating", "<a href=\"#gemini-tokens-cost\">Count tokens and cost</a>"],
      ["client.models.list", "List the models your key can use", "<a href=\"#gemini-models\">Choose a model</a>"]] },
    { h: "Going further", adv: true },
    { p: "Make one client and reuse it; it keeps a connection pool open. <code>client.aio.models.generate_content(...)</code> is the async version, for running many calls at once with <code>asyncio</code>. <code>client.chats.create(model=MODEL)</code> returns a chat object that keeps history for you; the examples here build history by hand so you can see what is sent. To stop a hung call from freezing a voice turn, set a timeout: <code>genai.Client(api_key=..., http_options=types.HttpOptions(timeout=30_000))</code> (milliseconds).", adv: true },
    { p: "The same SDK can also reach Gemini through Google Cloud's Vertex AI: <code>genai.Client(vertexai=True, project=\"...\", location=\"...\")</code>. The rest of your code stays the same.", adv: true },
    { watch: "The arguments are keyword-only. <code>generate_content(MODEL, \"hi\")</code> fails; write <code>model=</code> and <code>contents=</code>." }
  ],
  apis: [["genai.Client(api_key=...)", "The connection object."], ["types.GenerateContentConfig", "Settings for one call."], ["client.models.generate_content", "The call itself."]] },

{ id: "models", concepts: ["llm", "model-tier", "model-routing", "fallback", "open-weight", "context-window", "parameters", "inference"], section: "Get started", title: "Choose a model (and use several)", labs: [1, 2, 3, 4, 5],
  summary: "What the Gemini models are, how to check which ones your key can use, and how to run more than one in the same notebook.",
  blocks: [
    { p: "A <b>model</b> is the trained network that writes the answer. Google offers several sizes. A bigger model reasons better and follows tricky instructions more reliably; a smaller one is faster and much cheaper. You choose per call by passing <code>model=\"...\"</code>, so one notebook can use several." },
    { h: "The families" },
    { labcol: 3, table: [["Family", "Good at", "Cost and speed", "Used in"],
      ["Pro", "Hard reasoning, long documents, careful planning", "Slowest, most expensive, tightest free-tier limits", "Not used in the labs"],
      ["Flash", "Choosing tools, multi-step agents, most real work", "Middle", "Labs 3 and 4; the large model in Lab 2"],
      ["Flash-Lite", "Sorting, short answers, high volume", "Fastest and cheapest", "Labs 1 and 5; the small model in Lab 2"]] },
    { p: "A name reads as family, version and size: <code>gemini-2.5-flash-lite</code> is version 2.5, Flash-Lite size. Some names end in <code>-preview</code> or a date. Google retires and adds models regularly." },
    { h: "Check what your key can use" },
    { p: "A good setup cell lists the available models and checks yours. If it says NOT FOUND, copy a current name from the printed list into <code>MODEL</code>." },
    { code: py`MODEL = "gemini-2.5-flash-lite"   # cheap and fast

available = {m.name.split("/")[-1] for m in client.models.list()}
print(sorted(n for n in available if "flash" in n))
print(MODEL, "OK" if MODEL in available else "NOT FOUND: pick another name from the list")`, label: "Labs 1, 3, 4, 5" },
    { out: "A list such as ['gemini-2.5-flash', 'gemini-2.5-flash-lite', ...] and then  gemini-2.5-flash-lite OK" },
    { h: "How to pick" },
    { steps: ["Start with the cheapest model that might work (Flash-Lite).", "Write five to ten test messages with the answer you expect<span class='labref'> (Lab 1 Part 5 does this)</span>.", "Run them twice. If the small model gets them right and gives the same answer both times, keep it.", "Move up a size only for the cases it gets wrong. That is routing (below)."] },
    { h: "Use two models in one notebook" },
    { p: "This setup<span class='labref'> (from Lab 2)</span> uses a small and a large model side by side and passes the name on each call. The same helper serves both." },
    { code: py`SMALL = "gemini-3.5-flash-lite"   # cheap and fast: most cells use this
LARGE = "gemini-3.5-flash"        # used only where Part 3 routes to it

for name in (SMALL, LARGE):
    print(name, "OK" if name in available else "NOT FOUND: pick another name from the list")

def ask(system, text, model=SMALL):
    response = client.models.generate_content(
        model=model, contents=text,
        config=types.GenerateContentConfig(system_instruction=system))
    return (response.text or "").strip()`, label: "Lab 2 setup (shortened)" },
    { lab: true, watch: "Lab 2 uses <code>gemini-3.5-*</code> names while the other labs use <code>gemini-2.5-*</code>. Both work if the setup cell prints OK. If one says NOT FOUND, swap in a name from the printed list." },
    { h: "Route each message to the right model" },
    { p: "The small model labels the message first; easy labels stay on the small model and the rest go to the large one. You pay large-model prices only where they help." },
    { code: py`SIMPLE = {"order_status", "product_question"}

def reply(message):
    label, _ = sort_message(message)              # small model labels it
    model = SMALL if label in SIMPLE else LARGE   # code picks the model
    text, usage = ask(SUPPORT_PROMPT, message, model=model)
    return label, model, text`, label: "Lab 2 Part 3 (shortened)" },
    { h: "Name models by job, not by version", adv: true },
    { p: "When a project has several models, keep the names in one place keyed by what they are for. Changing a model is then one line, and you can see at a glance what every job costs.", adv: true },
    { code: py`MODELS = {
    "sort":  "gemini-2.5-flash-lite",   # labels and short answers
    "agent": "gemini-2.5-flash",        # tool use
}
missing = [m for m in MODELS.values() if m not in available]
print("All models OK" if not missing else f"NOT FOUND: {missing}")`, label: "Not in the labs", adv: true },
    { h: "Fall back to another model", adv: true },
    { p: "If one model is rate-limited or Google has a hiccup, try the next one instead of failing the customer. Only fall back on errors that a different model could fix.", adv: true },
    { code: py`def generate_with_fallback(contents, config, order=("agent", "sort")):
    for job in order:
        try:
            return client.models.generate_content(model=MODELS[job], contents=contents, config=config)
        except errors.APIError as e:
            if e.code not in (429, 500, 503):
                raise                                  # a bad request fails on every model
            print(f"{MODELS[job]} unavailable ({e.code}); trying the next model")
    raise RuntimeError("No model available")`, label: "Not in the labs", adv: true },
    { watch: "A fallback model may answer differently. Test your messages on every model in the chain, not only the first.", adv: true },
    { p: "For anything you evaluate or ship, record the exact model name with each result. An alias can quietly move to a newer model and change your scores. <code>m.input_token_limit</code> and <code>m.output_token_limit</code> on each listed model tell you its context size.", adv: true }
  ],
  apis: [["client.models.list()", "The models your key can use."], ["model=", "Which model a call uses; can change per call."], ["Model.input_token_limit", "How much a model can read at once."]] },

/* ================= Talk to the model ================= */
{ id: "first-call", concepts: ["prompt", "inference", "streaming", "latency"], section: "Talk to the model", title: "Send your first prompt", labs: [1],
  summary: "One call: send a question, print the answer, see how many tokens it used.",
  blocks: [
    { p: "Wrap the call in a small helper, <code>generate</code>, so the rest of the notebook stays short. It adds the system instruction, a length cap and an optional thinking setting, and retries if the free tier says \"too many requests\"." },
    { h: "The helper" },
    { code: py`def generate(contents, system=None, max_tokens=1024, thinking_budget=None):
    """One model call. contents is a string or a list of messages (Part 4)."""
    config = types.GenerateContentConfig(system_instruction=system, max_output_tokens=max_tokens)
    if thinking_budget is not None:
        config.thinking_config = types.ThinkingConfig(thinking_budget=thinking_budget)
    return with_retry(client.models.generate_content, model=MODEL, contents=contents, config=config)`, label: "Lab 1 setup" },
    { h: "Call it" },
    { code: py`response = generate(
    "Where is my order 4471?",
    system="You are RockTech's support assistant. Be brief.",
)
show(response)`, label: "Lab 1 Part 1" },
    { out: "The reply, then a line ---, then  finish_reason: STOP  and  tokens in/out: &lt;two numbers&gt;" },
    { p: "<code>show</code> is another small helper: it prints the text, why the model stopped and the token counts. See <a href=\"#gemini-read-reply\">Read the answer safely</a>." },
    { h: "Give it the facts" },
    { p: "The model cannot look up order 4471 by itself. Put the facts in the request and it answers from them. This is the idea behind tools and RAG later." },
    { code: py`order_data = "Order 4471: Wireless speaker, $59. Shipped 30 October. Arriving 2 November."
response = generate(
    "Where is my order 4471?",
    system=("You are RockTech's support assistant. Be brief. "
            "Answer using only the order data below.\n\nOrder data:\n" + order_data),
)
show(response)`, label: "Lab 1 Part 1b" },
    { watch: "Each call stands alone. The model does not remember the previous cell. See <a href=\"#gemini-conversation\">Hold a conversation</a>." },
    { h: "Stream the answer", adv: true },
    { p: "For chat and voice the first words should appear quickly. <code>generate_content_stream</code> takes the same arguments and yields pieces as they are written.", adv: true },
    { code: py`for chunk in client.models.generate_content_stream(model=MODEL, contents="Explain our returns policy", config=config):
    print(chunk.text or "", end="")`, label: "Not in the labs", adv: true }
  ],
  apis: [["client.models.generate_content(model, contents, config)", "Send one request."], ["contents=", "A string, or a list of messages."], ["generate_content_stream", "Same, but yields the reply in pieces."]] },

{ id: "system", concepts: ["system-prompt", "prompt", "guardrail"], section: "Talk to the model", title: "Give the model a role and rules", labs: [1, 2, 3, 4, 5],
  summary: "Use the system instruction for who the model is and how it must behave.",
  blocks: [
    { p: "The <b>system instruction</b> is separate from the customer's message. It sets the role, the tone and the rules for the whole request. Use one on every call." },
    { code: py`SYSTEM = ("You are RockTech's support assistant. Today is 4 November 2026. "
          "Use the tools for any fact about an order or a policy; never guess. Be brief and kind.")

config = types.GenerateContentConfig(system_instruction=SYSTEM)`, label: "Lab 3" },
    { h: "What to put in it" },
    { table: [["Put in the system instruction", "Put in contents"],
      ["Who the model is, tone, length", "The customer's message"],
      ["Rules that never change (\"never guess\")", "Facts for this request (an order, retrieved chunks)"],
      ["Today's date, the output format", "Earlier turns of the conversation"]] },
    { p: "For a phone agent, add speaking rules: one or two short sentences, no lists or links, read order numbers digit by digit." },
    { watch: "A system instruction is a request, not a lock. A rule that matters, like the $50 refund limit, must also be checked in your Python code. See <a href=\"#gemini-guard-actions\">Keep actions safe</a>." },
    { tip: "Keep the system text the same across calls and put what changes in <code>contents</code>. Results are easier to compare, and stable prefixes can be cached on paid tiers.", adv: true }
  ],
  apis: [["system_instruction=", "Standing rules for the request (a GenerateContentConfig field)."]] },

{ id: "length-thinking", concepts: ["max-tokens", "stop-reason", "chain-of-thought", "token-budget"], section: "Talk to the model", title: "Control length and thinking", labs: [1, 5],
  summary: "Cap the reply length, notice when it was cut off, and switch hidden thinking off for simple jobs.",
  blocks: [
    { h: "Cap the length" },
    { p: "<code>max_output_tokens</code> is a hard stop. When the reply reaches it, the reply ends mid-sentence and the finish reason is <code>MAX_TOKENS</code>." },
    { code: py`response = generate("Explain a typical online shop's returns policy in 200 words.", max_tokens=20)
show(response)
if finish_reason(response) == "MAX_TOKENS":
    print("Cut off. Raise max_output_tokens, ask for a shorter answer, or tell the user.")`, label: "Lab 1 Part 3" },
    { tip: "Control length with words (\"two sentences\") and keep the cap as a safety net. A reply that hits the cap is broken, not short." },
    { h: "Switch thinking off" },
    { p: "Recent Gemini models can \"think\" before answering: they write hidden reasoning that you pay for as output tokens. For sorting a message that is wasted time and money, so set the budget to 0.<span class='labref'> Labs 1 and 5 do.</span>" },
    { code: py`config = types.GenerateContentConfig(
    system_instruction=system, max_output_tokens=400,
    thinking_config=types.ThinkingConfig(thinking_budget=0))`, label: "Lab 5 ask()" },
    { watch: "Thinking tokens count against <code>max_output_tokens</code>. With thinking on and a small cap, the model can use the whole cap thinking and return no text. <span class='labref'>This is why Lab 2's helper ignores <code>max_tokens</code>.</span>" },
    { watch: "Some models cannot switch thinking fully off and reject 0. If the error mentions the thinking budget, remove the setting or use a Flash-Lite model." },
    { h: "Going further", adv: true },
    { table: [["thinking_budget", "Meaning"], ["0", "Off, where the model allows it"], ["-1", "The model decides how much to think"], ["a number", "At most that many thinking tokens"]], adv: true },
    { p: "<code>include_thoughts=True</code> returns thought summaries as parts marked <code>p.thought</code>. Newer models may use a <code>thinking_level</code> setting instead of a budget; check the model page. Decide with data: run your test set with thinking off and on and compare accuracy against <code>thoughts_token_count</code>.", adv: true }
  ],
  apis: [["max_output_tokens=", "Hard cap on reply length."], ["types.ThinkingConfig(thinking_budget=...)", "How much hidden reasoning to allow."]] },

{ id: "json", concepts: ["structured-output", "output-validation", "few-shot"], section: "Talk to the model", title: "Get JSON back", labs: [1, 2, 5],
  summary: "Make the model answer in a fixed shape your code can read, and handle it when it doesn't.",
  blocks: [
    { p: "Code cannot act on a friendly paragraph. For sorting, routing and decisions ask for JSON and turn it into a Python dict." },
    { h: "Ask for it in the prompt" },
    { code: py`SORTER = """You are RockTech's message sorter.
Give each message exactly one label: order_status, refund_request, product_question, complaint, other.
Reply with JSON only, no other text: {"intent": "<label>", "order_id": "<the order number, or null>"}
If unsure, use "other". Never reply to the customer."""`, label: "Lab 1 Part 5 (shortened)" },
    { h: "Parse it safely" },
    { p: "Models sometimes wrap JSON in a code fence or add a word. Strip the fence, then parse, and treat anything that fails as a failed answer instead of crashing." },
    { code: ["def parse_json(raw):", "    raw = raw.strip()", "    if raw.startswith(\"```\"):", "        raw = raw.strip(\"`\").removeprefix(\"json\").strip()", "    try:", "        return json.loads(raw)", "    except json.JSONDecodeError:", "        return {\"error\": \"not valid JSON\", \"raw\": raw}"], label: "Lab 1 Part 5" },
    { h: "Force the shape with a schema" },
    { p: "Gemini can enforce the shape for you. Set the reply type to JSON and give a schema with the allowed values." },
    { code: py`SCHEMA = {
    "type": "object",
    "properties": {
        "intent": {"type": "string", "enum": ["order_status", "refund_request", "product_question", "complaint", "other"]},
        "order_id": {"type": "string", "nullable": True},
    },
    "required": ["intent", "order_id"],
}
config = types.GenerateContentConfig(
    system_instruction=system,
    thinking_config=types.ThinkingConfig(thinking_budget=0),
    response_mime_type="application/json",
    response_schema=SCHEMA,
)`, label: "Lab 1 Part 5e" },
    { watch: "A schema guarantees the shape, not the truth. The model can still pick the wrong label, so keep testing accuracy<span class='labref'> (Lab 1 Part 5b)</span>." },
    { watch: "The reply is still a string in <code>response.text</code>. Call <code>json.loads</code> on it." },
    { h: "Use a Pydantic class", adv: true },
    { code: py`from typing import Literal, Optional
from pydantic import BaseModel

class Route(BaseModel):
    intent: Literal["order_status", "refund_request", "product_question", "complaint", "other"]
    order_id: Optional[str]

config = types.GenerateContentConfig(response_mime_type="application/json", response_schema=Route)
r = client.models.generate_content(model=MODEL, contents="Refund order 6012 please", config=config)
print(r.parsed.intent, r.parsed.order_id)     # a ready Route object`, label: "Not in the labs", adv: true },
    { p: "One step further: the JSON says \"approve\", but the $50 rule is still checked in code before any money moves.", adv: true }
  ],
  apis: [["response_mime_type=\"application/json\"", "Ask for JSON."], ["response_schema=", "The exact shape: dict, or a Pydantic class."], ["json.loads(text)", "JSON string to Python dict."], ["response.parsed", "Ready object when the schema is a class."]] },

{ id: "conversation", concepts: ["messages", "short-term-memory", "state", "context-window"], section: "Talk to the model", title: "Hold a conversation", labs: [1, 5],
  summary: "The model remembers nothing between calls. Your code keeps the history and sends it every time.",
  blocks: [
    { p: "Each call is separate. To make a chat, keep a list of messages and send the whole list on every call. Gemini calls its own turns <code>\"model\"</code>; the customer and tool results are <code>\"user\"</code>." },
    { code: py`SYSTEM = "You are RockTech's support assistant. Be brief."
history = []

def chat(user_text):
    history.append(types.Content(role="user", parts=[types.Part(text=user_text)]))
    response = generate(history, system=SYSTEM)
    history.append(response.candidates[0].content)   # role "model"
    print("Customer:", user_text)
    print("Agent:   ", text_of(response))
    print(f"[turn {len(history) // 2}: input tokens {tokens(response)[0]}]")

chat("Hi, my name is Asha.")
chat("I bought a laptop from you last week.")
chat("What's my name, and what did I buy?")`, label: "Lab 1 Part 4" },
    { out: "The third answer knows Asha and the laptop. Watch input tokens grow every turn." },
    { p: "Now run <code>history = []</code> and ask \"What's my name?\" again. It does not know. The memory was the list, not the model." },
    { h: "Simple dicts instead of Content objects" },
    { p: "You can also store history as plain dicts (the same shape Claude uses) and converts them just before the call." },
    { code: py`def _contents(messages):
    # Gemini calls the assistant's role "model"
    return [types.Content(role="model" if m["role"] == "assistant" else "user",
                          parts=[types.Part(text=m["content"])]) for m in messages]`, label: "Lab 5 setup" },
    { watch: "Messages must take turns: user, model, user. Two user messages in a row, or a history starting with a model turn, can be rejected. A helper such as <code>safe_cut</code> makes sure a trimmed history starts with a user message." },
    { tip: "Every turn resends everything, so cost and delay grow with the chat. See <a href=\"#gemini-memory-window\">Keep long chats in budget</a>.", adv: true },
    { p: "<code>client.chats.create(model=MODEL, config=config)</code> returns a chat object whose <code>send_message(text)</code> keeps the history for you. Handy for quick scripts; the examples here build it by hand so you can see and trim what is sent.", adv: true }
  ],
  apis: [["types.Content(role, parts)", "One message."], ["types.Part(text=...)", "One piece of a message."], ["response.candidates[0].content", "The model's turn, to append to history."], ["client.chats.create", "A chat that keeps history for you."]] },

{ id: "tokens-cost", concepts: ["token", "tokenizer", "cost-per-call", "prompt-caching", "token-budget"], section: "Talk to the model", title: "Count tokens and estimate cost", labs: [1, 2, 5],
  summary: "See what a message really costs, before and after the call.",
  blocks: [
    { p: "Models read and write <b>tokens</b>, pieces of words. You pay per token in and per token out. Hindi and JSON often take more tokens than you expect, so count real ones." },
    { h: "Before the call: count_tokens" },
    { code: py`def count(text):
    return with_retry(client.models.count_tokens, model=MODEL, contents=text).total_tokens

for name, text in {"English": "I need a refund for order 5520",
                   "Hindi": "मुझे ऑर्डर 5520 के लिए रिफंड चाहिए"}.items():
    print(f"{name:10} words={len(text.split()):3}  tokens={count(text)}")`, label: "Lab 1 Part 2" },
    { h: "After the call: usage_metadata" },
    { p: "Every reply carries its bill. Thinking tokens are billed as output even though you never see them, so add them in." },
    { code: py`def tokens(response):
    u = response.usage_metadata
    return (u.prompt_token_count or 0), (u.candidates_token_count or 0) + (u.thoughts_token_count or 0)`, label: "Lab 1 setup" },
    { h: "Turn tokens into money" },
    { code: py`PRICE_IN, PRICE_OUT = 2.50, 10.00   # illustrative $ per million tokens, as on the slides

def cost(tokens_in, tokens_out):
    return tokens_in * PRICE_IN / 1_000_000 + tokens_out * PRICE_OUT / 1_000_000

print(f"One chat:          ${"$"}{cost(3000, 500):.4f}")
print(f"10,000 chats a day: ${"$"}{cost(3000, 500) * 10_000:.2f}")`, label: "Lab 1 Part 2b" },
    { watch: "These prices are illustrative. Replace them with the current prices for your model from Google's pricing page." },
    { watch: "Fields can be <code>None</code> when zero, hence <code>or 0</code>." },
    { h: "Going further", adv: true },
    { table: [["usage_metadata field", "Meaning"], ["prompt_token_count", "Everything you sent: system, history, tool results"], ["candidates_token_count", "The visible reply"], ["thoughts_token_count", "Hidden thinking, billed as output"], ["cached_content_token_count", "Input served from cache, billed lower"], ["total_token_count", "All of it"]], adv: true },
    { p: "<code>count_tokens</code> has no system instruction field, so count the system text as an extra message. For an agent, add usage across every call in one customer turn: a turn with two tool calls is three model calls. Cost per resolved conversation is the number a business watches.", adv: true }
  ],
  apis: [["client.models.count_tokens(model, contents)", "Count tokens, no reply."], ["response.usage_metadata", "Token counts for a call."]] },

/* ================= Read replies and handle errors ================= */
{ id: "read-reply", concepts: ["stop-reason", "hallucination", "output-validation"], section: "Read replies and handle errors", title: "Read the answer safely", labs: [1, 3, 4, 5],
  summary: "Get the text out without crashing, skip hidden thinking, and check why the model stopped.",
  blocks: [
    { h: "The quick way" },
    { code: py`print(response.text)
answer = (response.text or "").strip()`, label: "Labs 2, 3, 4" },
    { watch: "<code>response.text</code> can be <code>None</code>: when the model only asked for a tool, or the reply was blocked. Write <code>or \"\"</code> before calling <code>.strip()</code>." },
    { h: "The careful way" },
    { p: "A reply is made of parts. This helper joins only the real text parts, skips thinking parts, and checks that a reply exists at all." },
    { code: py`def text_of(response):
    """Join the text parts of a reply. Thinking parts, if any, are skipped."""
    if not response.candidates or not response.candidates[0].content or not response.candidates[0].content.parts:
        return ""
    return "".join(p.text for p in response.candidates[0].content.parts if p.text and not p.thought)`, label: "Lab 1 setup" },
    { h: "Check why it stopped" },
    { code: py`def finish_reason(response):
    return response.candidates[0].finish_reason.name if response.candidates else "NO_CANDIDATES"`, label: "Lab 1 setup" },
    { table: [["finish_reason", "What happened", "What to do"],
      ["STOP", "Finished normally", "Use the answer"],
      ["MAX_TOKENS", "Hit your length cap", "Raise the cap or ask for less"],
      ["SAFETY", "Blocked by safety filters", "Rephrase; don't show a partial answer"],
      ["MALFORMED_FUNCTION_CALL", "A broken tool request", "Retry once, then hand to a person"]] },
    { h: "Going further", adv: true },
    { p: "When <code>candidates</code> is empty, <code>response.prompt_feedback</code> often says why the prompt was blocked. In production, log the finish reason with every call: a rise in <code>MAX_TOKENS</code> or <code>SAFETY</code> after a prompt change is an early warning. Every SDK object is a Pydantic model, so <code>response.model_dump()</code> shows everything when you are debugging.", adv: true }
  ],
  apis: [["response.text", "All text parts joined, or None."], ["response.candidates[0].content.parts", "The reply part by part."], ["Part.thought", "True on thinking parts."], ["candidate.finish_reason", "Why the model stopped."]] },

{ id: "errors", concepts: ["rate-limit", "retry", "fallback"], section: "Read replies and handle errors", title: "Handle errors and rate limits", labs: [1, 2, 3, 4, 5],
  summary: "Catch Gemini's errors, wait and retry on 429, and fix the request on everything else.",
  blocks: [
    { p: "The free tier allows only a few requests per minute and a limited number per day. Go over and Google answers with error <b>429</b>. This helper waits 15, 30 and 45 seconds before giving up." },
    { code: py`def with_retry(fn, *args, **kwargs):
    """On a rate-limit error (429) wait and try again."""
    for attempt in range(4):
        try:
            return fn(*args, **kwargs)
        except errors.APIError as e:
            if e.code != 429 or attempt == 3:
                raise
            wait = 15 * (attempt + 1)
            print(f"(rate limit: waiting {wait} s)")
            time.sleep(wait)

response = with_retry(client.models.generate_content, model=MODEL, contents=text, config=config)`, label: "Lab 1 setup" },
    { h: "Which errors to retry" },
    { table: [["Code", "Meaning", "Retry?"],
      ["400", "Bad request: wrong field, bad model name, invalid key", "No. Fix the request"],
      ["401 / 403", "Key missing, wrong or not allowed", "No. Fix the key"],
      ["404", "Model not found", "No. Check the name (<a href=\"#gemini-models\">Choose a model</a>)"],
      ["429", "Too many requests or quota used up", "Yes, after a wait"],
      ["500 / 503", "Google's side had a problem", "Yes, after a short wait"]] },
    { watch: "If a loop of test messages stalls halfway, that is 429. Wait a minute or use a Lite model. If it fails all day, the daily quota is used up." },
    { h: "Going further", adv: true },
    { p: "<code>errors.ClientError</code> covers 4xx and <code>errors.ServerError</code> covers 5xx, so you can handle them separately. Add a little randomness to waits so many workers don't retry at the same moment. For bulk runs such as a 200-question test set, pace your calls rather than relying on retries. To try a different model instead of waiting, see the fallback in <a href=\"#gemini-models\">Choose a model</a>.", adv: true },
    { code: py`except errors.ServerError as e:      # 5xx: Google's side
    ...
except errors.ClientError as e:      # 4xx: your request, or 429
    print(e.code, e.status, e.message)`, label: "Not in the labs", adv: true }
  ],
  apis: [["errors.APIError", "Any error from Google's server; has .code and .message."], ["errors.ClientError / ServerError", "4xx and 5xx."], ["time.sleep(seconds)", "Wait before retrying."]] },

/* ================= Tools and agents ================= */
{ id: "define-tool", concepts: ["tool-calling", "tool-schema", "mcp"], section: "Tools and agents", title: "Describe a tool", labs: [3, 4, 5],
  summary: "Tell the model what a tool is for and what inputs it takes. The model never sees your Python.",
  blocks: [
    { p: "A <b>tool</b> is a Python function the model can ask you to run, like <code>order_lookup</code>. You describe it with a name, a description and a JSON schema for its inputs. The model chooses tools almost entirely from the description." },
    { h: "Write the description and schema" },
    { code: py`SCHEMAS = {
    "order_lookup": (
        "Look up one RockTech order for the logged-in customer. Use for status, delivery, tracking "
        "and to confirm an order before a refund. Returns item, total, status and dates.",
        {"type": "object",
         "properties": {"order_id": {"type": "string", "description": "Order number, e.g. 4471"}},
         "required": ["order_id"]}),
    "knowledge_search": (
        "Search RockTech's help centre: products, delivery, returns and warranty policy. "
        "Not for one customer's order: use order_lookup for that.",
        {"type": "object",
         "properties": {"query": {"type": "string", "description": "What to look up, in a few words"}},
         "required": ["query"]}),
}`, label: "Lab 3 (two of the four tools)" },
    { h: "Turn them into Gemini tools" },
    { code: py`def make_tools(names):
    return [types.Tool(function_declarations=[
        types.FunctionDeclaration(name=n, description=SCHEMAS[n][0], parameters_json_schema=SCHEMAS[n][1])
        for n in names])]

config = types.GenerateContentConfig(system_instruction=SYSTEM, tools=make_tools(["order_lookup"]))`, label: "Lab 3" },
    { tip: "Say when to use the tool and when not to (\"Not for one customer's order\"). Vague descriptions are the most common reason the model picks the wrong tool." },
    { tip: "Offer only the tools the task needs. Fewer tools, fewer wrong choices." },
    { h: "Going further", adv: true },
    { p: "Use <code>enum</code> for fixed choices<span class='labref'> (Lab 3's refund <code>reason</code>)</span>, and describe formats (\"Order number, e.g. 4471\"). <code>parameters_json_schema</code> takes plain JSON Schema, the same format other providers use; there is also <code>parameters=</code> with the SDK's own <code>types.Schema</code>.", adv: true },
    { p: "If you pass a Python function directly, <code>tools=[order_lookup]</code>, the SDK writes the declaration from its type hints and docstring and runs it for you (automatic function calling). The examples here avoid this so you see and control each step. <code>tool_config=types.ToolConfig(function_calling_config=types.FunctionCallingConfig(mode=\"ANY\"))</code> forces a tool call; <code>\"NONE\"</code> forbids one.", adv: true }
  ],
  apis: [["types.FunctionDeclaration(name, description, parameters_json_schema)", "One tool's description."], ["types.Tool(function_declarations=[...])", "A bundle of tools for config.tools."], ["tools=", "GenerateContentConfig field."]] },

{ id: "one-tool-call", concepts: ["tool-calling", "tool-result", "grounding"], section: "Tools and agents", title: "Run one tool call by hand", labs: [3],
  summary: "See the model ask, your code run the tool, and the model answer from the result.",
  blocks: [
    { p: "The model never touches your database. It replies with a <b>function call</b>: the tool name and arguments. Your code decides whether to run it, then sends the result back." },
    { h: "1. The model asks" },
    { code: py`config = types.GenerateContentConfig(system_instruction=SYSTEM, tools=make_tools(["order_lookup"]))
contents = [types.Content(role="user", parts=[types.Part(text="Where is my order 4471?")])]

reply = generate(contents, config)
print("text:", reply.text)
for call in reply.function_calls or []:
    print("function call ->", call.name, dict(call.args))`, label: "Lab 3 Part 1" },
    { out: "text: None\nfunction call -> order_lookup {'order_id': '4471'}" },
    { h: "2. Your code runs it and sends the result back" },
    { code: py`call = reply.function_calls[0]
result = order_lookup(**call.args)                    # your code runs the real tool

contents.append(reply.candidates[0].content)          # the model's request
contents.append(types.Content(role="user", parts=[
    types.Part.from_function_response(name=call.name, response=result)]))
final = generate(contents, config)
print("answer:", final.text)`, label: "Lab 3 Part 1b" },
    { out: "answer: a sentence using the real status and dates from the database." },
    { watch: "<code>function_calls</code> is <code>None</code> when there are none. Always write <code>reply.function_calls or []</code>." },
    { watch: "<code>response=</code> must be a dict. Send errors as a dict too, like <code>{\"error\": \"No order 7300 on this account\"}</code>. An empty result invites the model to make something up." },
    { tip: "Append the model's original <code>candidates[0].content</code>, not a rebuilt copy. Newer models attach hidden data to it that they need on the next call.", adv: true }
  ],
  apis: [["response.function_calls", "The tools the model wants run (.name, .args)."], ["types.Part.from_function_response(name, response)", "Wrap a tool result to send back."]] },

{ id: "agent-loop", concepts: ["agent", "agent-loop", "react", "stopping-condition", "observability"], section: "Tools and agents", title: "Build the agent loop", labs: [3, 4],
  summary: "Repeat ask, run tools, send results, until the model answers or the step budget runs out.",
  blocks: [
    { p: "An <b>agent</b> is the one-tool-call pattern in a loop. Each round the model either asks for tools or answers. A step budget stops a confused model from looping forever." },
    { h: "Run tools by name, and never crash" },
    { code: py`TOOL_FUNCS = {"order_lookup": order_lookup, "knowledge_search": lambda query: knowledge_search(query),
              "refund_process": lambda **a: refund_process(**a), "escalate_to_human": escalate_to_human}

def run_tool(name, args):
    """Run one tool. Returns (result, is_error)."""
    if name not in TOOL_FUNCS:
        return {"error": f"Unknown tool {name}. Tools: {list(TOOL_FUNCS)}"}, True
    try:
        result = TOOL_FUNCS[name](**args)
        return result, "error" in result
    except Exception as e:
        return {"error": f"{name} failed: {e}"}, True`, label: "Lab 3 Part 2" },
    { h: "The loop" },
    { code: py`def run_agent(message, tool_names, max_steps=8):
    config = types.GenerateContentConfig(system_instruction=SYSTEM, tools=make_tools(tool_names))
    contents = [types.Content(role="user", parts=[types.Part(text=message)])]
    for step in range(max_steps):
        reply = generate(contents, config)
        calls = reply.function_calls or []
        if not calls:
            return reply.text                         # the model chose to answer
        contents.append(reply.candidates[0].content)
        outputs = run_all([(c.name, dict(c.args)) for c in calls])
        parts = []
        for c, (output, is_error) in zip(calls, outputs):
            print(f"step {step + 1}: {c.name}({dict(c.args)}) -> {output}")
            parts.append(types.Part.from_function_response(name=c.name, response=output))
        contents.append(types.Content(role="user", parts=parts))
    return "Let me pass you to a colleague."           # step budget used up

print(run_agent("Where is order 4471? It said Tuesday.", ["order_lookup", "knowledge_search"]))`, label: "Lab 3 Part 2" },
    { out: "step 1: order_lookup({'order_id': '4471'}) -> {...}\nthen the final answer." },
    { tip: "Try <code>max_steps=1</code><span class='labref'> (Lab 3 Part 2b)</span>. The customer gets the fallback line, written by your code, not the model." },
    { watch: "When the model asks for several tools in one turn, return all results in one <code>user</code> message, in the same order. The loop above does this." },
    { h: "Going further", adv: true },
    { p: "Keep tool results small: return the fields the model needs, not whole rows, because every result is input tokens on the next step. Log each step (tool, args, result, tokens) so you can replay a bad conversation. Run the same question several times: the path can change even when the answer is right<span class='labref'> (Lab 3 Check 2)</span>.", adv: true }
  ],
  apis: [["run_tool(name, args)", "Helper: look up and run a tool, return errors as data."], ["run_agent(message, tool_names, max_steps)", "Helper: the loop."]] },

{ id: "guard-actions", concepts: ["guardrail", "idempotency", "least-privilege", "human-in-the-loop", "escalation", "prompt-injection", "retry"], section: "Tools and agents", title: "Keep actions safe", labs: [3, 4, 5],
  summary: "Check every request in code, keep money rules out of the prompt, report failures clearly and make retries safe.",
  blocks: [
    { p: "The model only asks. Your code decides. Anything that moves money or changes data gets checked in Python, whatever the prompt says." },
    { h: "Check the request" },
    { p: "A safe refund tool checks the order belongs to this customer, the amount is sensible, the reason is allowed, and sends anything over $50 to a person." },
    { code: py`def refund_process(order_id, amount, reason):
    order = get_order(order_id)                       # SQL filters on CUSTOMER: other people's orders never come back
    if order is None:
        return {"error": f"No order {order_id} on this account"}
    if not isinstance(amount, (int, float)) or not 0 < amount <= order["total"]:
        return {"error": f"amount must be a number in USD between 0 and {order['total']}"}
    if reason not in REASONS:
        return {"error": f"reason must be one of {REASONS}"}
    if amount > 50:                                   # the $50 rule, in code
        return escalate_to_human(f"Refund of ${"$"}{amount} for order {order_id} ({reason}) needs approval", "high")
    return pay(order_id, amount, key=f"refund-{order_id}")`, label: "Lab 3 Part 3" },
    { h: "Fail clearly" },
    { p: "When a tool breaks, say so. The bad way is returning an empty result that looks like success, so the model invents an answer. The <code>run_tool</code> helper returns <code>{\"error\": ...}</code> instead, and the model tells the customer the system is down." },
    { h: "Retry only what is safe to repeat" },
    { code: py`def with_retry(fn, *args, tries=3):
    for i in range(tries):
        try:
            return fn(*args)
        except TimeoutError as e:
            if i == tries - 1:
                raise
            wait = 2 ** i                       # 1, 2, 4 seconds
            print(f"try {i + 1} failed ({e}); waiting {wait} s")
            time.sleep(wait)`, label: "Lab 3 Part 4c" },
    { p: "A lookup is safe to retry. A refund is not: the first try may have gone through before it timed out. Send an <b>idempotency key</b>, and the database's PRIMARY KEY makes the second try a no-op." },
    { code: py`first  = pay("6012", 30.0, key="refund-6012")   # imagine this timed out after it went through
second = pay("6012", 30.0, key="refund-6012")   # the retry: same key, no second refund`, label: "Lab 3 Part 4d" },
    { h: "On the phone", adv: true },
    { p: "A phone agent needs two more gates in code: the caller must be verified before any lookup, and an order number must be read back and confirmed (\"yes\") before a refund. Speech-to-text mishears digits, so the confirmation is recorded by code, not by the model.", adv: true },
    { p: "The same idea applies to memory: <code>save_preference</code> only accepts keys and values from an allowed list, so the model cannot save a \"credit limit\" for anyone.", adv: true }
  ],
  apis: [["{\"error\": ...}", "How tools report failure to the model."], ["idempotency key", "Makes a repeated action safe."], ["sqlite3.IntegrityError", "The database refusing a bad write."]] },

{ id: "parallel-tools", concepts: ["latency", "tool-calling", "workflow"], section: "Tools and agents", title: "Run tools at the same time", labs: [3],
  summary: "When the model asks for two independent tools, run them together so the customer waits less.",
  blocks: [
    { p: "A simple <code>run_all</code> runs tools one after another. If each takes 0.4 seconds, two take 0.8. Run together, they take about 0.4." },
    { code: py`from concurrent.futures import ThreadPoolExecutor

def run_all(requests):
    with ThreadPoolExecutor() as pool:
        return list(pool.map(lambda r: run_tool(*r), requests))

start = time.time()
print(run_agent("Where is order 4471? And do the X200 headphones work with an iPhone 15?",
                ["order_lookup", "knowledge_search"]))
print(f"total: {time.time() - start:.1f} s")`, label: "Lab 3 Part 5b" },
    { p: "<code>run_agent</code> does not change. Only <code>run_all</code> does. <code>pool.map</code> returns results in the same order as the requests." },
    { watch: "Only run tools together when neither needs the other's result. A refund must wait for the lookup that confirms it." },
    { tip: "Threads suit waiting work such as network and database calls. In async code, <code>asyncio.gather</code> does the same job. Use <code>time.perf_counter()</code> for precise timing.", adv: true }
  ],
  apis: [["ThreadPoolExecutor", "Run functions at the same time."], ["pool.map(fn, items)", "Results in input order."], ["time.time()", "Seconds now, for before and after timing."]] },

/* ================= Search by meaning ================= */
{ id: "embeddings", concepts: ["embedding", "embedding-model", "vector", "open-weight"], section: "Search by meaning", title: "Turn text into vectors", labs: [2],
  summary: "Use a free embedding model in Colab to turn each sentence into 384 numbers.",
  blocks: [
    { p: "An <b>embedding</b> is a list of numbers that captures what a sentence means. Sentences with similar meaning get similar numbers, even with no words in common. This example uses a small open-source model that runs inside Colab: no key and no cost." },
    { code: py`from sentence_transformers import SentenceTransformer
embedder = SentenceTransformer("all-MiniLM-L6-v2")

messages = [
    "Where is my package?",
    "Has order 4471 shipped yet?",
    "My parcel still hasn't arrived",
    "I want my money back for the broken charger",
    "Please refund order 6012",
    "Do the X200 headphones work with an iPhone 15?",
]
vectors = embedder.encode(messages, normalize_embeddings=True)
print("Each message is now", vectors.shape[1], "numbers")`, label: "Lab 2 Part 2" },
    { out: "Each message is now 384 numbers" },
    { watch: "The first run downloads the model (about 90 MB). A Hugging Face token warning is safe to ignore for this public model." },
    { watch: "Use the same model for stored texts and questions. Vectors from two models cannot be compared." },
    { h: "Gemini's own embedding model", adv: true },
    { p: "Gemini also offers hosted embeddings. They are often stronger, but cost calls and quota.", adv: true },
    { code: py`result = client.models.embed_content(model="gemini-embedding-001", contents=messages)
vectors = [e.values for e in result.embeddings]`, label: "Not in the labs", adv: true },
    { p: "all-MiniLM-L6-v2 reads about 256 word pieces; longer text is cut off. Embed documents once and store the vectors; only the question is embedded at search time.", adv: true }
  ],
  apis: [["SentenceTransformer(name)", "Load a local embedding model."], ["embedder.encode(texts, normalize_embeddings=True)", "Texts to vectors."], ["client.models.embed_content", "Gemini's hosted embeddings."]] },

{ id: "semantic-search", concepts: ["cosine-similarity", "vector", "top-k", "vector-database", "rag", "hybrid-search", "reranking"], section: "Search by meaning", title: "Find the closest match", labs: [2],
  summary: "Compare vectors with cosine similarity and return the top matches. The core of retrieval.",
  blocks: [
    { h: "Cosine similarity by hand" },
    { p: "Cosine similarity measures whether two vectors point the same way: 1 means the same meaning, 0 means unrelated. Start with three-number toy vectors." },
    { code: py`import numpy as np
A = np.array([0.9, 0.1, 0.1])
B = np.array([0.8, 0.2, 0.0])
C = np.array([0.1, 0.0, 0.9])

def cosine(u, v):
    return float(np.dot(u, v) / (np.linalg.norm(u) * np.linalg.norm(v)))

print(round(cosine(A, B), 2), round(cosine(A, C), 2))`, label: "Lab 2 Part 1" },
    { p: "Double every number in A and the score does not change: cosine looks at direction, not length." },
    { h: "Search real messages" },
    { code: py`def nearest(query, k=2):
    q = embedder.encode([query], normalize_embeddings=True)[0]
    sims = vectors @ q                      # normalised, so a dot product is the cosine
    for i in np.argsort(-sims)[:k]:
        print(f"{sims[i]:.2f}  {messages[i]}")

nearest("When will my order get here?")`, label: "Lab 2 Part 2b" },
    { out: "The two delivery messages come first, though they share few words with the question." },
    { watch: "<code>np.argsort</code> returns positions, not scores. Use the position to look up both the score and the text." },
    { h: "Going further", adv: true },
    { p: "<code>vectors @ vectors.T</code> gives every pair's similarity at once<span class='labref'> (Lab 2 Part 2a)</span>. For large collections, <code>np.argpartition(-sims, k)[:k]</code> finds the top k without a full sort; beyond that, a vector index such as FAISS or a vector database does approximate search. Scores only compare within one model: 0.6 from one model is not 0.6 from another. Hybrid search adds keyword search (BM25) and reranking on top of this.", adv: true }
  ],
  apis: [["np.dot, np.linalg.norm", "The cosine formula."], ["vectors @ q", "All similarities at once (normalised vectors)."], ["np.argsort(-sims)[:k]", "Positions of the top k."]] },

{ id: "routing", concepts: ["model-routing", "prompt-chaining", "workflow", "escalation", "supervisor-worker"], section: "Search by meaning", title: "Route and chain calls", labs: [2],
  summary: "Label a message, send it to the right handler, and chain calls with a gate in code.",
  blocks: [
    { p: "Real support systems are rarely one call. Three common patterns: a sorter that picks the model (see <a href=\"#gemini-models\">Choose a model</a>), a chain of calls with a gate, and a router dictionary." },
    { h: "A chain with a gate" },
    { p: "Rate the complaint, and if it is critical, stop and hand to a person. Otherwise draft a reply, then review it. The gate is an <code>if</code> in code." },
    { code: py`ALLOWED = {"low", "medium", "high", "critical"}

def clean_label(raw):
    word = raw.strip().strip(".!").lower()
    return word if word in ALLOWED else "critical"   # unknown: safest path

def complaint_chain(message):
    raw, _ = ask(RATE_PROMPT, message)
    severity = clean_label(raw)
    if severity == "critical":
        return escalate_to_human(message)
    draft, _ = ask(DRAFT_PROMPT.format(severity=severity), message)
    final, _ = ask(REVIEW_PROMPT, draft)
    return final`, label: "Lab 2 Part 4" },
    { watch: "If the model writes <code>Critical.</code> and you compare with <code>== \"critical\"</code>, the gate silently fails. Always clean labels before comparing<span class='labref'> (Lab 2 Part 4a)</span>." },
    { h: "A router dictionary" },
    { code: py`HANDLERS = {
    "order_status":     order_agent,
    "refund_request":   refund_chain,
    "product_question": answer_from_docs,
    "complaint":        complaint_chain,
}

def route(message):
    label, _ = sort_message(message)
    handler = HANDLERS.get(label.strip().lower(), escalate_to_human)   # unknown: a person
    return handler(message)`, label: "Lab 2 Part 5" },
    { tip: "To add a label, add a function and one line to <code>HANDLERS</code>. <code>route()</code> does not change<span class='labref'> (Lab 2 Part 5a)</span>." },
    { p: "Sending unknown labels to the safest path costs some needless escalations. Sending them to the cheapest path risks ignoring a legal threat. Decide which mistake you can afford<span class='labref'> (Lab 2 Check 4)</span>.", adv: true }
  ],
  apis: [["ask(system, text, model)", "Helper: one call, returns text and tokens."], ["dict.get(key, default)", "Pick a handler, with a fallback."]] },

/* ================= Memory ================= */
{ id: "memory-window", concepts: ["token-budget", "sliding-window", "summarization", "short-term-memory", "lost-in-the-middle", "context-window"], section: "Memory", title: "Keep long chats in budget", labs: [5],
  summary: "History grows every turn. Trim it with a sliding window, or fold old turns into a summary.",
  blocks: [
    { p: "Because every call resends the whole chat, a long conversation gets slower and dearer, and eventually stops fitting. Measure it, then try two fixes." },
    { h: "Watch it grow" },
    { code: py`for n in [1, 5, 15, 40]:
    chat = make_chat(n)
    print(f"{n:3} turns: {count_tokens(SYSTEM, chat):5} tokens")`, label: "Lab 5 Part 2 (shortened)" },
    { h: "Fix 1: a sliding window" },
    { code: py`def sliding_window(messages, keep_last=10):
    """Keep only the most recent messages. Cheap and simple, but the start of the chat is gone."""
    return messages[-keep_last:]`, label: "Lab 5 Part 2b" },
    { watch: "The customer's name and order were in turn 1. After the window, the agent has forgotten them." },
    { h: "Fix 2: fold old turns into a summary" },
    { code: py`KEEP = ("Summarize this support chat for the agent who takes over. Keep: the customer's name, order numbers, "
        "the issue, what was tried, and every promise made. Leave out small talk. At most 60 words.")

def compress(messages, keep_last=10, rules=KEEP):
    cut = safe_cut(messages, keep_last)          # recent part must start with a customer message
    old, recent = messages[:cut], messages[cut:]
    summary, _, _ = ask(rules, [{"role": "user", "content": as_transcript(old)}], max_tokens=200)
    return summary, recent

summary, recent = compress(chat)
system_with_summary = SYSTEM + "\n\nEarlier in this chat: " + summary`, label: "Lab 5 Part 3" },
    { out: "tokens before: a large number; tokens after: much smaller, and the agent still knows the order and the promise." },
    { tip: "The words in <code>KEEP</code> decide what survives. A weak rule (\"one short sentence\") loses the promise.", adv: true },
    { p: "A wrong summary is worse than none: every later turn trusts it. Test summaries like any other output, with known facts that must survive.", adv: true }
  ],
  apis: [["count_tokens(system, messages)", "Helper around client.models.count_tokens."], ["sliding_window", "Keep the last N messages."], ["compress", "Summarise old turns, keep recent ones."]] },

{ id: "long-term-memory", concepts: ["long-term-memory", "state", "least-privilege"], section: "Memory", title: "Remember customers between sessions", labs: [5],
  summary: "Store open tickets, short session notes and checked preferences in the database, and load them next time.",
  blocks: [
    { p: "Long-term memory is just data your code saves and loads. This example keeps three kinds in SQLite and puts them in the system instruction at the start of a session." },
    { h: "Load context at the start" },
    { code: py`def load_context(customer_id):
    """Everything the agent should know before the customer speaks. Your code runs this, not the model."""
    who = query("SELECT name, city FROM customers WHERE customer_id = ?", (customer_id,))[0]
    lines = [f"Customer: {who['name']} ({customer_id}), {who['city']}."]
    for t in query("SELECT ticket_id, summary, opened FROM tickets WHERE customer_id = ? AND status = 'open'", (customer_id,)):
        lines.append(f"Open issue {t['ticket_id']} since {t['opened']}: {t['summary']}.")
    for s in query("SELECT day, summary FROM session_summaries WHERE customer_id = ? ORDER BY id DESC LIMIT 3", (customer_id,)):
        lines.append(f"Earlier ({s['day']}): {s['summary']}")
    for p in query("SELECT key, value FROM preferences WHERE customer_id = ?", (customer_id,)):
        lines.append(f"Preference: {p['key']} = {p['value']}.")
    return "\n".join(lines)`, label: "Lab 5 Part 4" },
    { h: "Let the model ask to save a preference" },
    { code: py`ALLOWED = {"contact_channel": {"email", "phone", "sms"},
           "language": {"english", "hindi", "marathi", "tamil"}}

def save_preference(key, value):
    value = str(value).strip().lower()
    if key not in ALLOWED or value not in ALLOWED[key]:
        return {"error": f"Not saved. Allowed: {ALLOWED}"}
    query("INSERT OR REPLACE INTO preferences (customer_id, key, value) VALUES (?, ?, ?)", (CUSTOMER, key, value))
    return {"saved": {key: value}}`, label: "Lab 5 Part 4c" },
    { p: "The customer id comes from <code>CUSTOMER</code>, the logged-in user, never from the model. So the model cannot save a preference for someone else." },
    { h: "Save one line at the end" },
    { code: py`SESSION_RULES = ("Write one line, at most 25 words, for this customer's history file: what they wanted, "
                 "what was done, and anything promised. No greetings, no date.")

def end_session(customer_id, messages, day="6 Nov"):
    line, _, _ = ask(SESSION_RULES, [{"role": "user", "content": as_transcript(messages)}], max_tokens=80)
    query("INSERT INTO session_summaries (customer_id, day, summary) VALUES (?, ?, ?)", (customer_id, day, line.strip()))
    return line.strip()`, label: "Lab 5 Part 4d" },
    { watch: "Store a short line, not the transcript. Transcripts grow without limit and carry personal details you may not be allowed to keep." , adv: true }
  ],
  apis: [["load_context(customer_id)", "tickets, notes, preferences as text."], ["save_preference(key, value)", "A tool with an allow list."], ["end_session", "one-line note per session."]] },

/* ================= Data ================= */
{ id: "database", concepts: ["state", "tool-result", "least-privilege"], section: "Data", title: "Set up and query the RockTech database", labs: [3, 4, 5],
  summary: "A small SQLite file stands in for RockTech's order system. Query it safely and look inside it.",
  blocks: [
    { p: "SQLite is a database in one file, built into Python, so there is nothing to install. The examples create RockTech's tables (customers, orders, help articles, payments, tickets and preferences) and load the invented test records." },
    { h: "Connect and query" },
    { code: py`import sqlite3
con = sqlite3.connect(DB)
con.row_factory = sqlite3.Row          # rows behave like dicts
con.execute("PRAGMA foreign_keys = ON")

rows = [dict(r) for r in con.execute("SELECT * FROM orders WHERE order_id = ?", ("4471",)).fetchall()]`, label: "Labs 3 to 5 (inside connect() and query())" },
    { watch: "Always use <code>?</code> placeholders, never an f-string with text in the SQL. And a single value needs a trailing comma: <code>(\"4471\",)</code>." },
    { h: "Look inside" },
    { code: py`import pandas as pd
pd.read_sql_query("SELECT * FROM refunds", con)`, label: "Labs 3, 5 (the sql() helper)" },
    { p: "This is for you. Tools return plain dicts, not tables, because the model needs JSON-like data." },
    { h: "Let the database refuse bad data" },
    { code: py`try:
    query("INSERT INTO orders (order_id, customer_id, item, total, status) VALUES (?, ?, ?, ?, ?)", bad)
except sqlite3.IntegrityError as e:
    print("refused: ", bad, "->", e)`, label: "Lab 3" },
    { p: "Rules in the table (no negative totals, allowed statuses only, real customers only) hold even if a prompt or tool has a bug." },
    { h: "Going further", adv: true },
    { p: "The file lives on the Colab machine and is lost when the session ends; <code>reset_db()</code> rebuilds it. Set <code>DATA_URL</code> to load the seed records from a link instead. <code>with con:</code> wraps several writes in one transaction that rolls back on error. Give each tool the narrowest query it needs (one order, for the logged-in customer) rather than a general \"run SQL\" tool.", adv: true }
  ],
  apis: [["sqlite3.connect(path)", "Open the database file."], ["con.execute(sql, params)", "Run SQL with ? placeholders."], ["pd.read_sql_query(sql, con)", "Show a result as a table."], ["sqlite3.IntegrityError", "A write broke a table rule."]] },

/* ================= Voice ================= */
{ id: "text-to-speech", concepts: ["latency", "streaming"], section: "Voice", title: "Make the agent speak", labs: [4],
  summary: "Turn a reply into an mp3 with free Google voices, in English or Hindi.",
  blocks: [
    { code: py`from gtts import gTTS
from IPython.display import Audio, display

def speak(text, path="reply.mp3", lang="en", tld="co.in", play=True):
    """tld picks the accent: co.in Indian, co.uk British, com US."""
    gTTS(text, lang=lang, tld=tld).save(path)
    if play:
        display(Audio(path))
    return path

speak("Hello, you are through to RockTech support. How can I help?")
speak("नमस्ते, टेकस्टोर सपोर्ट में आपका स्वागत है।", path="hindi.mp3", lang="hi")`, label: "Lab 4 Part 1" },
    { out: "An audio player under the cell for each line." },
    { watch: "gTTS needs the internet and can be rate-limited if you make many files quickly." },
    { tip: "Long replies take long to speak. A good phone prompt asks for one or two short sentences, no lists, no links." },
    { p: "gTTS is meant for prototypes. Production voice agents use a paid text-to-speech service that streams audio, so speech starts while the rest is being made.", adv: true }
  ],
  apis: [["gTTS(text, lang, tld).save(path)", "Text to mp3."], ["display(Audio(path))", "An audio player in the notebook."]] },

{ id: "speech-to-text", concepts: ["latency", "evaluation"], section: "Voice", title: "Turn speech into text", labs: [4],
  summary: "Transcribe a recording with Whisper on Colab's CPU, and catch spoken order numbers.",
  blocks: [
    { code: py`from faster_whisper import WhisperModel
stt_model = WhisperModel("base", device="cpu", compute_type="int8")

def transcribe(path, language="en"):
    """language=None lets the model guess the language."""
    segments, info = stt_model.transcribe(path, language=language)
    return " ".join(s.text.strip() for s in segments)

print(transcribe("caller_refund.mp3"))`, label: "Lab 4 Part 2" },
    { table: [["Model size", "Speed on Colab CPU", "Accuracy"], ["tiny / base", "Fast", "Slips on numbers and names"], ["small / medium", "Much slower", "Better"], ["large-v3", "Too slow on CPU; use a GPU runtime", "Best"]] },
    { h: "Catch spoken numbers" },
    { p: "Callers say \"six oh one two\" or \"double four seven one\". A helper such as <code>spoken_numbers</code> turns those into 6012 and 4471, then the agent reads the number back before acting." },
    { code: py`print(spoken_numbers("order six oh one two"))     # ['6012']
print(spoken_numbers("double four seven one"))    # ['4471']`, label: "Lab 4 Part 3" },
    { watch: "<code>segments</code> is lazy: the real work happens when you loop over it. Time the join, not just the call." },
    { p: "<code>vad_filter=True</code> skips silence; <code>initial_prompt=\"RockTech, X200 headphones\"</code> hints at vocabulary. On a GPU runtime use <code>device=\"cuda\", compute_type=\"float16\"</code>. Measure word error rate on your own callers before trusting any setting.", adv: true }
  ],
  apis: [["WhisperModel(size, device, compute_type)", "Load Whisper."], ["stt_model.transcribe(path, language)", "Audio to (segments, info)."], ["spoken_numbers(text)", "Helper: spoken digits to order numbers."]] },

{ id: "microphone", concepts: ["latency"], section: "Voice", title: "Record your microphone in Colab", labs: [4],
  summary: "Colab runs on Google's machine, so a little JavaScript records in your browser and sends the audio back.",
  blocks: [
    { p: "Your Python runs far away on a Colab server with no microphone. The fix is to send a small JavaScript function to your browser tab; it records for a few seconds and returns the audio as text, which Python decodes into a file." },
    { p: "First, the JavaScript that runs in your browser. It asks for the microphone, records for the given time, and hands back the audio as a data URL." },
    { code: py`RECORD_JS = """
const sleep = t => new Promise(r => setTimeout(r, t));
const toText = blob => new Promise(res => { const fr = new FileReader(); fr.onloadend = e => res(e.target.result); fr.readAsDataURL(blob); });
var record = ms => new Promise(async resolve => {
  const stream = await navigator.mediaDevices.getUserMedia({audio: true});
  const rec = new MediaRecorder(stream); const chunks = [];
  rec.ondataavailable = e => chunks.push(e.data);
  rec.onstop = async () => { stream.getTracks().forEach(t => t.stop()); resolve(await toText(new Blob(chunks))); };
  rec.start(); await sleep(ms); rec.stop();
});
"""`, label: "Lab 4 Part 2b" },
    { p: "Then the Python that sends it to the browser, waits for the recording and saves it as a file." },
    { code: py`from base64 import b64decode
from IPython.display import Javascript
from google.colab.output import eval_js

def record(seconds=5, path="mic.webm"):
    display(Javascript(RECORD_JS))                 # load the recorder into the browser
    print(f"Recording for {seconds} s... speak now")
    data = eval_js(f"record({seconds * 1000})")
    open(path, "wb").write(b64decode(data.split(",")[1]))
    return path

mine = record(5)
print("Heard:", transcribe(mine))`, label: "Lab 4 Part 2b" },
    { watch: "The browser asks for microphone permission the first time. Click Allow. This only works in Colab, not in plain Jupyter." },
    { p: "<code>eval_js</code> runs JavaScript in your tab and waits for the result. The audio comes back as a base64 data URL; the part after the comma is the file. Browsers usually record WebM/Opus, which faster-whisper can read.", adv: true }
  ],
  apis: [["eval_js(code)", "Run JavaScript in the browser and get the result."], ["b64decode", "Text back to audio bytes."]] },

{ id: "phone-turn", concepts: ["latency", "streaming", "agent-loop", "observability"], section: "Voice", title: "Build and time a phone turn", labs: [4],
  summary: "Hear, think, speak: chain speech-to-text, the agent and text-to-speech, and see where the caller waits.",
  blocks: [
    { p: "One phone turn is three stages. Time each with <code>time.perf_counter()</code>, a precise stopwatch." },
    { code: py`def phone_turn(audio_path):
    times = {}
    t = time.perf_counter(); heard = transcribe(audio_path); times["speech to text"] = time.perf_counter() - t
    call_log.append(f"Caller: {heard}")
    t = time.perf_counter(); answer = run_agent("\n".join(call_log), PHONE); times["agent"] = time.perf_counter() - t
    call_log.append(f"Agent: {answer}")
    t = time.perf_counter(); speak(answer, path=f"agent_{len(call_log)}.mp3"); times["text to speech"] = time.perf_counter() - t
    print("  ".join(f"{k}: {v:.1f} s" for k, v in times.items()), f"| total: {sum(times.values()):.1f} s")`, label: "Lab 4 Part 4 (confirmation steps left out)" },
    { out: "speech to text: 1.2 s  agent: 2.8 s  text to speech: 0.9 s | total: 4.9 s   (your numbers will differ)" },
    { p: "A full version also checks the caller's \"yes\" when the agent read back an order number. See <a href=\"#gemini-guard-actions\">Keep actions safe</a>." },
    { tip: "Look at which stage is slowest. That is the silence the caller hears<span class='labref'> (Lab 4 Check 4)</span>." },
    { p: "The number that matters on a phone is time to first audio. Streaming speech-to-text, a streamed model reply (<code>generate_content_stream</code>) and streaming text-to-speech overlap the stages. Report the median and the slowest 10 percent, not just the average. Gemini can also take audio directly with <code>types.Part.from_bytes(data=..., mime_type=\"audio/mp3\")</code>; keeping Whisper separate lets you see and time it.", adv: true }
  ],
  apis: [["time.perf_counter()", "A precise stopwatch."], ["phone_turn(audio_path)", "hear, think, speak, timed."], ["types.Part.from_bytes", "Send audio or images to Gemini directly."]] }

  ]
});
