/* Lab Reference: shared registry. Each topics_<product>.js file calls REF.add({...}).
   To add a product (for example Claude): create topics_claude.js with the same shape as
   topics_gemini.js, remove "planned: true", and make sure the page loads it with a <script> tag. */
/* What the page shows. Lab and course-day data stays in the files; these switches only hide it.
   labs: lab chips, the lab filter, "Lab N Part M" code labels and lab-only sentences (class labref).
   days: the course-day chip on each concept and the day filter.
   logo: the Kakudi logo (also commented out in the page HTML).
   changelog: the "What's new" list on the home page. Off until the first full release; keep adding entries to CHANGELOG. */
const SHOW = { labs: false, days: false, logo: false, changelog: false };

const REF = {
  products: [],
  add(p) { this.products.push(Object.assign({ sections: [], topics: [] }, p)); }
};

const LABS = {
  1: "Lab 1 · First API calls",
  2: "Lab 2 · Embeddings, routing, chains",
  3: "Lab 3 · Agent loop and tools",
  4: "Lab 4 · Voice channel",
  5: "Lab 5 · Memory and state"
};

const CHANGELOG = [
  { date: "2026-11-15", text: "New section: Monitoring and observability, 12 topics. Structured JSON logs with a conversation id, masking card numbers and emails, OpenTelemetry traces, tokens and cost per conversation, metrics with p50 and p95, a quick dashboard, alerts, feedback and review, Cloud Logging and Cloud Trace, and ADK callbacks. The example project is in the repository under examples/observability. Ten monitoring terms added to Concepts." },
  { date: "2026-11-14", text: "New section: Test automation, 15 topics. Free tests with a fake Gemini client (tools, the agent loop, JSON, 429 and 503 retries, token and cost caps), then live evals (a 20-message golden set, a judge model, prompt-injection tests, comparing a new model, ADK evalsets) and GitHub Actions CI. The example project is in the repository under examples/testing. Ten testing terms added to Concepts." },
  { date: "2026-11-14", text: "New section: Agent Platform (formerly Vertex AI), 13 topics covering the ML lifecycle: notebooks, labelling, AutoML, training, experiments, Feature Store, Model Registry, endpoints, pipelines, monitoring and Model Garden. Six lifecycle terms added to Concepts." },
  { date: "2026-11-14", text: "New sections: Gemini ADK (9 topics, from install to deploying on Cloud Run) and Google Cloud (10 topics: projects, sign-in, IAM, Gemini on Agent Platform, Cloud Storage, BigQuery, Secret Manager, cloud tools, cost). Six cloud terms added to Concepts. Topics now link to the official documentation." },
  { date: "2026-11-13", text: "Public edition: the pages now read as general how-to articles." },
  { date: "2026-11-13", text: "Concepts added: the Agentic AI Dictionary (141 terms, 9 categories) is now part of this page. Every Gemini topic lists its key ideas, and every term links back to the topics that use it." },
  { date: "2026-11-13", text: "Rebuilt around tasks: 27 Gemini how-to topics in 8 sections, from Install Gemini to a timed phone turn. Claude is listed as coming next." },
  { date: "2026-11-13", text: "First edition: 49 Gemini API entries." }
];
