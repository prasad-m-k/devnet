/* Agentic AI Reference: Gemini Enterprise Agent Platform (formerly Vertex AI), the ML lifecycle.
   Same shape as topics_gemini.js. Checked against docs.cloud.google.com on 2026-11-14:
   - classic ML stays in google-cloud-aiplatform (use >= 2.0.1, avoid 2.0.0), "from google.cloud import aiplatform" + aiplatform.init
   - Gemini calls moved to google-genai (genai.Client(enterprise=True, ...)); agent-only work can use google-cloud-agentplatform
   - the managed Data Labeling Service shut down on 3 October 2024 (topic "labeling" says what to use instead)
   Feature Store and Model Monitoring APIs change often: those topics stay at console level on purpose. */

REF.add({
  id: "ap",
  name: "Agent Platform",
  blurb: "Gemini Enterprise Agent Platform (formerly Vertex AI): Google Cloud's services for the whole ML lifecycle, from notebooks and training to endpoints, monitoring and Model Garden.",
  sections: [
    ["Overview", "The lifecycle map and the one-time SDK setup every other topic uses."],
    ["Build", "Notebooks, labelled data and AutoML."],
    ["Train and track", "Custom training, experiment tracking and shared features."],
    ["Deploy and operate", "Register models, serve them online or in batch, automate with pipelines, and watch them in production."],
    ["Foundation models", "Gemini, partner and open models ready to use or deploy."]
  ],
  topics: [

/* ================= Overview ================= */
{ id: "lifecycle", section: "Overview", title: "The ML lifecycle on Agent Platform", labs: [],
  concepts: ["ml-model", "training", "inference", "ml-pipeline", "model-registry", "endpoint"],
  summary: "Which Agent Platform service covers each stage, from the first notebook to monitoring in production.",
  blocks: [
    { p: "Gemini Enterprise Agent Platform is the new name for Vertex AI. Besides Gemini and agents, it holds Google Cloud's services for building, training and running your own machine learning models. Each stage below has its own topic." },
    { table: [["Stage", "Agent Platform service", "Topic"],
      ["Notebooks and IDEs", "Agent Platform Workbench, Colab Enterprise", "<a href=\"#ap-notebooks\">Work in notebooks</a>"],
      ["Data labelling", "Console labelling and partner services (the managed labelling service closed in 2024)", "<a href=\"#ap-labeling\">Label your data</a>"],
      ["No-code / AutoML", "AutoML on Agent Platform", "<a href=\"#ap-automl\">Train a model with AutoML</a>"],
      ["Model training", "Agent Platform Training, Managed Training Clusters", "<a href=\"#ap-training\">Run a custom training job</a>"],
      ["Experiment tracking", "Experiments on Agent Platform", "<a href=\"#ap-experiments\">Track experiments</a>"],
      ["Feature management", "Feature Store on Agent Platform", "<a href=\"#ap-feature-store\">Share features with Feature Store</a>"],
      ["Model registry", "Model Registry on Agent Platform", "<a href=\"#ap-registry\">Version models in the Model Registry</a>"],
      ["Model deployment", "Agent Platform Endpoints (online and batch)", "<a href=\"#ap-endpoints\">Serve predictions</a>"],
      ["MLOps and workflows", "Agent Platform Pipelines (Kubeflow, TFX)", "<a href=\"#ap-pipelines\">Automate with Pipelines</a>"],
      ["Model monitoring", "Model Monitoring on Agent Platform", "<a href=\"#ap-monitoring\">Monitor models in production</a>"],
      ["Foundation models", "Agent Platform Model Garden", "<a href=\"#ap-model-garden\">Use Model Garden</a>"]] },
    { h: "Where agents fit" },
    { p: "An agent rarely needs all of this. A typical RockTech agent calls Gemini, uses tools over BigQuery, and is deployed with ADK. The lifecycle services matter when you also own a classic model, for example a late-delivery predictor that an agent's tool calls through an endpoint." },
    { tip: "If a problem can be solved by prompting Gemini, try that first. Train your own model when you have labelled data, a narrow task, and a cost or latency target Gemini can't meet." },
    { p: "Older tutorials and Stack Overflow answers say \"Vertex AI\". The services, APIs (<code>aiplatform.googleapis.com</code>) and most code are the same; only the product name changed.", adv: true }
  ],
  docs: [["Agent Platform overview", "https://docs.cloud.google.com/gemini-enterprise-agent-platform/overview"]],
  apis: [["aiplatform.googleapis.com", "The API behind all Agent Platform services."]] },

{ id: "sdk", section: "Overview", title: "Set up the Agent Platform SDK", labs: [],
  concepts: ["sdk", "cloud-project", "adc"],
  summary: "Install google-cloud-aiplatform, point it at your project, region and a staging bucket.",
  blocks: [
    { p: "The classic ML services (datasets, training, models, endpoints, experiments, pipelines) use the <code>google-cloud-aiplatform</code> package. Gemini calls use <code>google-genai</code> instead (<a href=\"#gcp-gemini-cloud\">Call Gemini through your cloud project</a>). Both can live in the same environment." },
    { h: "Before you start" },
    { steps: ["A project with billing (<a href=\"#gcp-project\">Set up a project</a>).", "<code>aiplatform.googleapis.com</code> and <code>storage.googleapis.com</code> turned on (<a href=\"#gcp-apis\">Turn on the APIs you need</a>).", "Signed in with ADC (<a href=\"#gcp-auth\">Sign in from code</a>).", "A Cloud Storage bucket in the same region, used for training files and model artefacts."] },
    { code: py`gcloud storage buckets create gs://rocktech-ml-1234 --location=us-central1`, lang: "Terminal" },
    { h: "Install and initialise" },
    { code: py`%pip install -q --upgrade "google-cloud-aiplatform>=2.0.1"` },
    { code: py`from google.cloud import aiplatform

aiplatform.init(
    project="your-project-id",
    location="us-central1",
    staging_bucket="gs://rocktech-ml-1234",
)` },
    { p: "Every later call (datasets, jobs, models, endpoints) uses these settings unless you override them." },
    { watch: "Avoid version 2.0.0 of the package: Google's migration guide says to use 2.0.1 or later, or stay below 2.0.0 until you have migrated." },
    { watch: "The bucket, the training job and the endpoint should be in the same region. Mixing regions is a common cause of \"not found\" and permission errors." },
    { h: "What moved in SDK 2.x", adv: true },
    { table: [["You want", "Use"],
      ["Gemini calls, tuning, caching", "<code>google-genai</code> with <code>genai.Client(enterprise=True, ...)</code>"],
      ["Agents only (Agent Runtime, sessions, RAG)", "<code>google-cloud-agentplatform</code>, <code>import agentplatform</code>"],
      ["Classic ML: training, models, endpoints, pipelines, experiments", "<code>google-cloud-aiplatform</code>, <code>from google.cloud import aiplatform</code>"]], adv: true },
    { p: "The old <code>vertexai.generative_models</code> and <code>vertexai.language_models</code> modules are deprecated and print a warning. Code that uses them should move to <code>google-genai</code>.", adv: true }
  ],
  docs: [["Install the Agent Platform SDK for Python", "https://docs.cloud.google.com/gemini-enterprise-agent-platform/machine-learning/start/install-sdk"], ["SDK 2.0.1 migration guide", "https://docs.cloud.google.com/gemini-enterprise-agent-platform/machine-learning/python-sdk/sdk-migration"]],
  apis: [["google-cloud-aiplatform", "Python package for classic ML on Agent Platform."], ["aiplatform.init(project, location, staging_bucket)", "Default settings for all later calls."]] },

/* ================= Build ================= */
{ id: "notebooks", section: "Build", title: "Work in notebooks (Colab Enterprise and Workbench)", labs: [],
  concepts: ["training-data", "cloud-project"],
  summary: "Two managed notebook options inside your project: Colab Enterprise for quick work, Workbench for a full JupyterLab machine.",
  blocks: [
    { table: [["", "Colab Enterprise", "Agent Platform Workbench"],
      ["Feels like", "Google Colab, inside your project", "JupyterLab on your own virtual machine"],
      ["Set-up", "None: open and run", "Create an instance, choose machine and GPU"],
      ["Runs as", "Your account", "The instance's service account or your account"],
      ["Good for", "Exploring, BigQuery work, short jobs", "Long sessions, custom packages, heavier GPUs"],
      ["Stops", "Runtime shuts down when idle", "Runs (and bills) until stopped; idle shutdown can be set"]] },
    { h: "Colab Enterprise" },
    { steps: ["In the console, open <b>Agent Platform › Colab Enterprise</b>.", "Create a notebook, or import an .ipynb (such as one of your existing notebooks).", "Connect to a runtime. Your project's data and APIs are reachable without extra sign-in."] },
    { code: py`from google.cloud import bigquery
bigquery.Client().query("SELECT COUNT(*) AS n FROM rocktech.orders").to_dataframe()` },
    { p: "In Colab Enterprise the runtime already runs as you inside the project, so <code>auth.authenticate_user()</code> is not needed." },
    { h: "Workbench" },
    { code: py`gcloud workbench instances create rocktech-nb \
    --location=us-central1-a \
    --machine-type=e2-standard-4`, lang: "Terminal" },
    { p: "Then open the instance from <b>Agent Platform › Workbench</b> and choose <b>Open JupyterLab</b>." },
    { watch: "A Workbench instance bills while it runs, even if no notebook is open. Stop it when you finish (<code>gcloud workbench instances stop rocktech-nb --location=us-central1-a</code>) or set idle shutdown." },
    { p: "Both options read from BigQuery and Cloud Storage with the same client code as anywhere else (<a href=\"#gcp-bigquery\">Query BigQuery</a>). For anything that must run on a schedule, move notebook code into a pipeline (<a href=\"#ap-pipelines\">Automate with Pipelines</a>).", adv: true }
  ],
  docs: [["Colab Enterprise", "https://cloud.google.com/colab/docs"], ["Agent Platform Workbench", "https://cloud.google.com/vertex-ai/docs/workbench/introduction"]],
  apis: [["gcloud workbench instances create", "Create a Workbench machine."], ["Colab Enterprise", "Managed Colab inside your project."]] },

{ id: "labeling", section: "Build", title: "Label your data", labs: [],
  concepts: ["label", "training-data", "human-in-the-loop", "structured-output"],
  summary: "The managed labelling service has closed. Label in the console, use a partner, or let Gemini draft labels for people to check.",
  blocks: [
    { watch: "Google shut down the Vertex AI Data Labeling Service (the managed, human labelling jobs) on 3 October 2024, and the older AI Platform Data Labeling Service on 31 January 2025. Tutorials that create \"data labeling jobs\" no longer work." },
    { p: "Labels are still the most important input to a supervised model (see <a href=\"#term-label\">Label</a>). Today there are three practical routes." },
    { table: [["Route", "How", "When"],
      ["Console", "Create a dataset in Agent Platform and add labels in its viewer", "A few hundred images, videos or text items"],
      ["Partner", "A labelling vendor from Google Cloud Marketplace", "Large volumes, specialist knowledge, quality guarantees"],
      ["Gemini drafts, people check", "Gemini proposes a label with a schema; a person reviews the unsure ones", "Text and images where a good prompt gets most items right"]] },
    { h: "Let Gemini draft labels" },
    { p: "The same technique as <a href=\"#gemini-json\">Get JSON back</a>: a fixed list of labels, a schema, and a confidence field so people only review what the model was unsure about." },
    { code: py`import json
from google import genai
from google.genai import types

client = genai.Client(enterprise=True, project="your-project-id", location="global")
SCHEMA = {"type": "object",
          "properties": {"label": {"type": "string", "enum": ["order_status", "refund_request", "product_question", "complaint", "other"]},
                         "confident": {"type": "boolean"}},
          "required": ["label", "confident"]}
config = types.GenerateContentConfig(response_mime_type="application/json", response_schema=SCHEMA,
                                     system_instruction="Label this RockTech customer message. Set confident to false if two labels could fit.")

def draft_label(text):
    return json.loads(client.models.generate_content(model="gemini-2.5-flash", contents=text, config=config).text)

drafts = [(m, draft_label(m)) for m in messages]
to_review = [(m, d) for m, d in drafts if not d["confident"]]` },
    { watch: "Model-drafted labels carry the model's mistakes into your training data. Have people check a random sample of the confident ones too, and measure agreement before you trust the rest." },
    { p: "Import the reviewed labels into a dataset with a JSONL or CSV file in Cloud Storage. Each data type (image, text, video, tabular) has its own import format; check the dataset docs for the one you need.", adv: true }
  ],
  docs: [["Agent Platform deprecations (labelling service shutdown)", "https://docs.cloud.google.com/vertex-ai/docs/deprecations"]],
  apis: [["Datasets in the console", "Add and edit labels by hand."], ["Gemini with response_schema", "Draft labels in a fixed format."]] },

{ id: "automl", section: "Build", title: "Train a model with AutoML", labs: [],
  concepts: ["automl", "classification", "train-test-split", "baseline"],
  summary: "Give AutoML a labelled table or image set and a target; it chooses and tunes the model for you.",
  blocks: [
    { p: "<b>AutoML</b> trains a model without you writing model code. You give it data and the column to predict; it tries model types and settings and keeps the best. It suits tabular data and images." },
    { h: "Tabular: predict which orders arrive late" },
    { code: py`from google.cloud import aiplatform
aiplatform.init(project="your-project-id", location="us-central1", staging_bucket="gs://rocktech-ml-1234")

dataset = aiplatform.TabularDataset.create(
    display_name="rocktech-deliveries",
    bq_source="bq://your-project-id.rocktech.deliveries",
)

job = aiplatform.AutoMLTabularTrainingJob(
    display_name="late-delivery-automl",
    optimization_prediction_type="classification",
)
model = job.run(
    dataset=dataset,
    target_column="late",
    budget_milli_node_hours=1000,      # 1 node hour: the training budget
)` },
    { out: "The job runs for up to the budget (often an hour or more). When it ends, model is in the Model Registry with its evaluation metrics." },
    { steps: ["Open the model in <b>Model Registry</b> and read the evaluation: precision, recall, confusion matrix.", "Compare against a simple baseline before you celebrate (<a href=\"#term-baseline\">Baseline</a>).", "Deploy it to an endpoint, or run batch predictions (<a href=\"#ap-endpoints\">Serve predictions</a>)."] },
    { watch: "Training is billed by node hours, and the budget is a cap, not an estimate. Start with the smallest budget the API accepts and raise it only if the metrics justify it." },
    { watch: "Leakage beats AutoML too. A column that is only known after delivery (like <code>delivered_at</code>) makes the model look perfect and fail in use. Remove it from the table first." },
    { p: "For text tasks (sorting messages, extracting fields), Google now points to Gemini, with prompting or tuning, rather than AutoML text models. Images use <code>aiplatform.ImageDataset</code> and <code>aiplatform.AutoMLImageTrainingJob</code> in the same way.", adv: true }
  ],
  docs: [["AutoML on Agent Platform", "https://cloud.google.com/vertex-ai/docs/beginner/beginners-guide"]],
  apis: [["aiplatform.TabularDataset.create(bq_source=...)", "A dataset from a BigQuery table."], ["aiplatform.AutoMLTabularTrainingJob", "An AutoML training job."], ["job.run(dataset, target_column, budget_milli_node_hours)", "Train and return a Model."]] },

/* ================= Train and track ================= */
{ id: "training", section: "Train and track", title: "Run a custom training job", labs: [],
  concepts: ["training", "hyperparameter", "ml-model"],
  summary: "Send your own training script to Google's machines and get a registered model back.",
  blocks: [
    { p: "When you need your own code (scikit-learn, XGBoost, PyTorch, TensorFlow), write a normal training script. Agent Platform runs it on the machines you choose, then stores the model it saves." },
    { h: "1. The training script" },
    { code: py`# train.py
import os, joblib, pandas as pd
from google.cloud import storage
from sklearn.ensemble import RandomForestClassifier

df = pd.read_csv("gs://rocktech-ml-1234/data/deliveries.csv")
X, y = df.drop(columns=["late"]), df["late"]
model = RandomForestClassifier(n_estimators=200, max_depth=8).fit(X, y)

joblib.dump(model, "model.joblib")
out = os.environ["AIP_MODEL_DIR"]          # gs://... folder that Agent Platform gives the job
bucket, _, prefix = out.removeprefix("gs://").partition("/")
storage.Client().bucket(bucket).blob(prefix.rstrip("/") + "/model.joblib").upload_from_filename("model.joblib")`, lang: "train.py" },
    { h: "2. Submit the job" },
    { code: py`job = aiplatform.CustomTrainingJob(
    display_name="late-delivery-rf",
    script_path="train.py",
    container_uri="us-docker.pkg.dev/vertex-ai/training/sklearn-cpu.1-0:latest",            # pick a current image
    requirements=["pandas", "gcsfs", "google-cloud-storage"],
    model_serving_container_image_uri="us-docker.pkg.dev/vertex-ai/prediction/sklearn-cpu.1-0:latest",
)
model = job.run(replica_count=1, machine_type="n1-standard-4")` },
    { out: "Logs stream into the cell; at the end, model is in the Model Registry." },
    { watch: "The container image versions above are examples. Choose current ones from the \"prebuilt containers\" list in the docs, matching your framework version." },
    { watch: "Save the model to <code>AIP_MODEL_DIR</code>. If the script saves only to the local disk, the file disappears with the machine." },
    { h: "Bigger jobs", adv: true },
    { p: "Add GPUs with <code>accelerator_type</code> and <code>accelerator_count</code> on <code>job.run</code>. Hyperparameter tuning jobs run the same script many times with different settings and keep the best. For very large training (many GPUs or TPUs for days), <b>Managed Training Clusters</b> give you reserved, managed capacity; those are planned with your Google Cloud team rather than started from a notebook.", adv: true }
  ],
  docs: [["Custom training overview", "https://cloud.google.com/vertex-ai/docs/training/overview"], ["Prebuilt training containers", "https://cloud.google.com/vertex-ai/docs/training/pre-built-containers"]],
  apis: [["aiplatform.CustomTrainingJob(script_path, container_uri, ...)", "Run your script as a job."], ["job.run(replica_count, machine_type)", "Start it; returns a Model."], ["AIP_MODEL_DIR", "Where the script must save the model."]] },

{ id: "experiments", section: "Train and track", title: "Track experiments", labs: [],
  concepts: ["experiment-tracking", "hyperparameter", "evaluation"],
  summary: "Record the settings and scores of every run so you can compare them and repeat the best one.",
  blocks: [
    { p: "Without tracking, \"the version that worked last Tuesday\" is lost. An <b>experiment</b> groups runs; each <b>run</b> stores its parameters and metrics." },
    { code: py`aiplatform.init(project="your-project-id", location="us-central1", experiment="late-delivery")

for depth in [4, 8, 12]:
    aiplatform.start_run(f"rf-depth-{depth}")
    aiplatform.log_params({"model": "random_forest", "max_depth": depth, "n_estimators": 200})
    precision, recall = train_and_score(depth)          # your own function
    aiplatform.log_metrics({"precision": precision, "recall": recall})
    aiplatform.end_run()

aiplatform.get_experiment_df()       # one row per run, ready to sort` },
    { out: "A table with a row per run: parameters and metrics side by side. The same appears under Agent Platform › Experiments." },
    { tip: "It works for prompts too. Log the prompt version, model name and temperature as parameters, and your test-set scores (accuracy, faithfulness) as metrics. That turns prompt changes into comparable experiments." },
    { watch: "Log the data version as a parameter (a table snapshot date or a file hash). Two runs on different data can't be compared fairly." },
    { p: "Runs can also hold time-series metrics (loss per epoch) with <code>aiplatform.log_time_series_metrics</code>, and link to the artefacts and models they produced, which gives you lineage from data to deployed model.", adv: true }
  ],
  docs: [["Experiments on Agent Platform", "https://cloud.google.com/vertex-ai/docs/experiments/intro-vertex-ai-experiments"]],
  apis: [["aiplatform.init(experiment=...)", "Choose the experiment."], ["aiplatform.start_run / end_run", "One tracked run."], ["log_params / log_metrics", "Record settings and scores."], ["aiplatform.get_experiment_df()", "All runs as a table."]] },

{ id: "feature-store", section: "Train and track", title: "Share features with Feature Store", labs: [],
  concepts: ["feature-store", "feature", "feature-engineering", "data-leakage", "latency"],
  summary: "Compute features once in BigQuery, then serve the same values to training and to live predictions.",
  blocks: [
    { p: "A <b>feature</b> is an input to a model, such as \"orders in the last 30 days\". When training computes it one way and the live system another, predictions quietly go wrong (training-serving skew). <b>Feature Store</b> keeps one definition and serves it to both." },
    { h: "How it is organised" },
    { table: [["Piece", "What it is"],
      ["BigQuery table or view", "Where features are computed and stored. This is the source of truth."],
      ["Feature group", "Registers a BigQuery source and the features in it"],
      ["Online store", "A low-latency copy for live predictions"],
      ["Feature view", "Which features the online store serves, and how often it syncs from BigQuery"]] },
    { h: "Steps" },
    { steps: ["Write the features as a BigQuery table, one row per entity (customer) and time.",
      "In the console, open <b>Agent Platform › Feature Store</b> and create a feature group on that table.",
      "Create an online store, then a feature view that syncs the features you need on a schedule.",
      "Training reads the BigQuery table directly; the live service fetches the latest values from the online store by entity id."] },
    { code: py`CREATE OR REPLACE TABLE rocktech.customer_features AS
SELECT customer_id,
       CURRENT_TIMESTAMP() AS feature_timestamp,
       COUNTIF(ordered_at > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)) AS orders_30d,
       AVG(total) AS avg_order_value
FROM rocktech.orders
GROUP BY customer_id`, lang: "BigQuery SQL" },
    { watch: "For training, use feature values as they were at the time of each example, not today's values. Otherwise the model learns from the future (<a href=\"#term-data-leakage\">Data leakage</a>)." },
    { p: "Feature Store's Python API has changed between versions, so this page stays at console level. Use the current Feature Store docs for code. For many agent projects, a well-kept BigQuery table read by a tool is enough; add an online store when you need millisecond reads.", adv: true }
  ],
  docs: [["Feature Store on Agent Platform", "https://cloud.google.com/vertex-ai/docs/featurestore/latest/overview"]],
  apis: [["Feature group", "A BigQuery source registered as features."], ["Online store / feature view", "Low-latency serving of chosen features."]] },

/* ================= Deploy and operate ================= */
{ id: "registry", section: "Deploy and operate", title: "Version models in the Model Registry", labs: [],
  concepts: ["model-registry", "ml-model", "evaluation"],
  summary: "Every trained model gets a home, a version number and aliases like \"production\", so you always know what is serving.",
  blocks: [
    { p: "AutoML and custom training jobs put their models in the <b>Model Registry</b> automatically. You can also upload a model trained anywhere." },
    { h: "Upload a model you trained yourself" },
    { code: py`model = aiplatform.Model.upload(
    display_name="late-delivery",
    artifact_uri="gs://rocktech-ml-1234/models/rf-v1/",          # folder with model.joblib
    serving_container_image_uri="us-docker.pkg.dev/vertex-ai/prediction/sklearn-cpu.1-0:latest",
)` },
    { h: "Add a new version" },
    { code: py`v2 = aiplatform.Model.upload(
    parent_model=model.resource_name,          # same model, next version
    artifact_uri="gs://rocktech-ml-1234/models/rf-v2/",
    serving_container_image_uri="us-docker.pkg.dev/vertex-ai/prediction/sklearn-cpu.1-0:latest",
    is_default_version=False,
    version_aliases=["candidate"],
)` },
    { h: "Find models" },
    { code: py`for m in aiplatform.Model.list(filter='display_name="late-delivery"'):
    print(m.display_name, m.version_id, m.version_aliases)` },
    { tip: "Use aliases (\"production\", \"candidate\") in your deployment code rather than version numbers, and move the alias when a new version passes its checks." },
    { p: "Each version keeps its evaluation, lineage (which job and data produced it) and labels. Models trained in BigQuery ML can be registered too, so the registry becomes one list of everything you serve.", adv: true }
  ],
  docs: [["Model Registry", "https://cloud.google.com/vertex-ai/docs/model-registry/introduction"]],
  apis: [["aiplatform.Model.upload(...)", "Register a model or a new version."], ["parent_model / version_aliases", "Versioning and named aliases."], ["aiplatform.Model.list(filter)", "Find registered models."]] },

{ id: "endpoints", section: "Deploy and operate", title: "Serve predictions (online and batch)", labs: [],
  concepts: ["endpoint", "inference", "latency", "cost-per-call"],
  summary: "Deploy a model to an endpoint for live requests, or run a batch job over many rows at once.",
  blocks: [
    { table: [["", "Online endpoint", "Batch prediction"],
      ["Answers", "One request at a time, in milliseconds", "A whole file or table, in minutes to hours"],
      ["Billing", "Per node hour while deployed, busy or idle", "Only while the job runs"],
      ["Use for", "An agent tool that needs an answer now", "Scoring every open order each night"]] },
    { h: "Online: deploy and call" },
    { code: py`endpoint = model.deploy(
    machine_type="n1-standard-2",
    min_replica_count=1,
    max_replica_count=2,
)

result = endpoint.predict(instances=[[3, 12.5, 0, 1]])     # one row of features
print(result.predictions)` },
    { h: "Use it from an agent tool" },
    { code: py`ENDPOINT = aiplatform.Endpoint("projects/your-project-id/locations/us-central1/endpoints/ENDPOINT_ID")

def late_risk(order_id: str) -> dict:
    """Predict whether one RockTech order is likely to arrive late."""
    features = load_order_features(order_id)          # from BigQuery or Feature Store
    p = ENDPOINT.predict(instances=[features]).predictions[0]
    return {"order_id": order_id, "late_risk": p}` },
    { h: "Batch" },
    { code: py`batch = model.batch_predict(
    job_display_name="nightly-late-risk",
    bigquery_source="bq://your-project-id.rocktech.open_orders",
    bigquery_destination_prefix="bq://your-project-id.rocktech_predictions",
    machine_type="n1-standard-4",
)` },
    { watch: "An online endpoint bills every hour it is deployed, even with no traffic. Undeploy when you finish testing: <code>endpoint.undeploy_all()</code>, then <code>endpoint.delete()</code>." },
    { h: "Safer rollouts", adv: true },
    { code: py`v2.deploy(endpoint=endpoint, machine_type="n1-standard-2", traffic_percentage=10)   # 10% to the new version`, adv: true },
    { p: "Shift traffic in steps while you compare metrics, then move the rest. For Gemini itself you don't deploy anything; for many Gemini requests at once, the <code>google-genai</code> batch API (<code>client.batches.create</code>) is the batch equivalent and is cheaper than one call at a time.", adv: true }
  ],
  docs: [["Deploy a model to an endpoint", "https://cloud.google.com/vertex-ai/docs/general/deployment"], ["Batch predictions", "https://cloud.google.com/vertex-ai/docs/predictions/get-batch-predictions"]],
  apis: [["model.deploy(machine_type, min/max_replica_count)", "Create an online endpoint."], ["endpoint.predict(instances)", "One online prediction."], ["model.batch_predict(...)", "Score a whole table or file."], ["endpoint.undeploy_all() / delete()", "Stop paying for an endpoint."]] },

{ id: "pipelines", section: "Deploy and operate", title: "Automate with Pipelines", labs: [],
  concepts: ["ml-pipeline", "workflow", "observability"],
  summary: "Turn notebook steps into a repeatable pipeline that runs on a schedule and records every artefact.",
  blocks: [
    { p: "A <b>pipeline</b> is a chain of steps (prepare data, train, evaluate, register, deploy) that runs the same way every time. Agent Platform Pipelines runs pipelines written with Kubeflow Pipelines (KFP) or TFX." },
    { code: py`%pip install -q kfp` },
    { code: py`from kfp import dsl, compiler

@dsl.component(base_image="python:3.11", packages_to_install=["google-cloud-bigquery", "pandas"])
def count_late(table: str) -> int:
    from google.cloud import bigquery
    return list(bigquery.Client().query(f"SELECT COUNTIF(late) AS n FROM {table}").result())[0]["n"]

@dsl.component(base_image="python:3.11")
def check(n: int) -> str:
    return "retrain" if n > 100 else "ok"

@dsl.pipeline(name="late-delivery-check")
def pipeline(table: str = "rocktech.deliveries"):
    n = count_late(table=table)
    check(n=n.output)

compiler.Compiler().compile(pipeline_func=pipeline, package_path="pipeline.json")` },
    { code: py`job = aiplatform.PipelineJob(
    display_name="late-delivery-check",
    template_path="pipeline.json",
    pipeline_root="gs://rocktech-ml-1234/pipeline-root",
)
job.submit()` },
    { out: "A graph of the run under Agent Platform › Pipelines, with each step's logs, inputs and outputs." },
    { tip: "Each component runs in its own container, so it must import what it uses inside the function, as above." },
    { watch: "The pipeline runs as a service account. Give it only the roles its steps need (<a href=\"#gcp-iam\">Give access with IAM roles</a>), and pass it with <code>job.submit(service_account=...)</code>." },
    { p: "Google publishes ready-made components (Google Cloud Pipeline Components) for training, batch prediction and deployment. Schedules run a pipeline on a cron timetable; a typical MLOps loop is: monitoring raises drift, a scheduled pipeline retrains, evaluates against the current model, and registers a candidate for review.", adv: true }
  ],
  docs: [["Agent Platform Pipelines", "https://cloud.google.com/vertex-ai/docs/pipelines/introduction"], ["Kubeflow Pipelines", "https://www.kubeflow.org/docs/components/pipelines/"]],
  apis: [["@dsl.component / @dsl.pipeline", "Define steps and the pipeline (KFP)."], ["compiler.Compiler().compile", "Write the pipeline file."], ["aiplatform.PipelineJob(...).submit()", "Run it on Agent Platform."]] },

{ id: "monitoring", section: "Deploy and operate", title: "Monitor models in production", labs: [],
  concepts: ["data-drift", "observability", "evaluation"],
  summary: "Get alerted when live inputs drift away from the training data, before accuracy quietly falls.",
  blocks: [
    { p: "A model is trained on yesterday's world. When customers, products or seasons change, the inputs it sees drift, and its predictions get worse without any error message. <b>Model Monitoring</b> compares live inputs (and, when you have them, outcomes) against a baseline and alerts you." },
    { table: [["Check", "Compares", "Catches"],
      ["Training-serving skew", "Live inputs vs the training data", "A feature computed differently in production"],
      ["Prediction drift", "Live inputs now vs live inputs earlier", "The world changing, such as a festival season"],
      ["Feature attribution drift", "Which features drive predictions, over time", "The model leaning on a different signal"]] },
    { h: "Set it up" },
    { steps: ["Open your model in <b>Model Registry</b>, or its endpoint, and choose to set up monitoring.",
      "Point it at the training data (BigQuery table or Cloud Storage file) as the baseline.",
      "Pick the features to watch and a threshold for each.",
      "Choose how often to check and who gets the email or notification.",
      "Turn on request and response logging for the endpoint, so live traffic is kept in BigQuery for checks and later retraining."] },
    { watch: "Drift alerts tell you inputs changed, not that accuracy fell. Collect real outcomes (did the order arrive late?) and measure accuracy on them regularly." },
    { h: "For Gemini and agents", adv: true },
    { p: "There is no training data to drift from, so monitor behaviour instead: log every conversation's tools, tokens and finish reasons, and run your test set on a schedule with the evaluation service. A falling score after a model or prompt change is the agent version of drift.", adv: true },
    { p: "The Model Monitoring Python API has changed between versions, so this page stays at console level. Use the current Model Monitoring docs for code.", adv: true }
  ],
  docs: [["Model Monitoring", "https://cloud.google.com/vertex-ai/docs/model-monitoring/overview"]],
  apis: [["Model Monitoring", "Skew and drift checks with alerts."], ["Request-response logging", "Keep live traffic in BigQuery."]] },

/* ================= Foundation models ================= */
{ id: "model-garden", section: "Foundation models", title: "Use Model Garden", labs: [],
  concepts: ["llm", "open-weight", "fine-tuning", "model-tier"],
  summary: "A catalogue of Google, partner and open models: call some as a service, deploy others to your own endpoint.",
  blocks: [
    { p: "<b>Model Garden</b> lists the foundation models available in Agent Platform. They come in two kinds, and the difference matters for cost and set-up." },
    { table: [["Kind", "Examples", "How you use it", "You pay for"],
      ["Model as a service", "Gemini, and partner models offered as a managed API", "Call an API; nothing to deploy", "Tokens used"],
      ["Self-deployed", "Open-weight models such as Gemma, Llama and many others", "Deploy to your own endpoint, then call it", "The endpoint's machines, per hour, while deployed"]] },
    { h: "Gemini: just call it" },
    { p: "Gemini models in Model Garden are the ones you already call with <code>genai.Client(enterprise=True, ...)</code>. See <a href=\"#gcp-gemini-cloud\">Call Gemini through your cloud project</a>." },
    { h: "Open models: deploy, then call" },
    { steps: ["Open <b>Agent Platform › Model Garden</b> and pick a model, for example a small Gemma model.",
      "Read its model card: licence, sizes, intended use, and the machine and GPU it needs.",
      "Choose <b>Deploy</b>, accept the licence if asked, and choose a region and machine.",
      "When the endpoint is ready, call it from Python with <code>aiplatform.Endpoint(...).predict(...)</code>, using the request format on the model card."] },
    { watch: "A self-deployed model bills for its GPU machines every hour it stays deployed. Delete the endpoint when you finish (<a href=\"#ap-endpoints\">Serve predictions</a>)." },
    { tip: "Use an open model when you need it to run in your own project, need to fine-tune its weights, or have steady high volume where a dedicated machine is cheaper than per-token prices. Otherwise start with Gemini." },
    { p: "Model Garden also offers tuning for some models and one-click deploys with recommended settings. Partner models served as a managed API may need to be enabled once per project and are billed by the partner's price list.", adv: true }
  ],
  docs: [["Model Garden overview", "https://cloud.google.com/vertex-ai/generative-ai/docs/model-garden/explore-models"]],
  apis: [["Model Garden", "Catalogue of foundation models."], ["Deploy (self-deployed models)", "Puts an open model on your own endpoint."]] }

  ]
});
