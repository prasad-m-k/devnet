# Agentic AI Reference

A free knowledge base for building with AI agents: plain-language concepts, and task-by-task how-to pages with working Python.

**Read it:** https://prasad-m-k.github.io/devnet/

## What's inside

- **Concepts**: about 150 terms, from tokens and context windows to RAG, guardrails, service accounts and model registries, each with a plain definition and an example.
- **Gemini**: install, keys, models, prompts, JSON output, tools, the agent loop, embeddings, memory and voice, using the `google-genai` Python SDK.
- **Gemini ADK**: Google's Agent Development Kit, from first agent to multi-agent pipelines and deploying on Cloud Run.
- **Google Cloud**: projects, sign-in (ADC), IAM, Gemini on Agent Platform, Cloud Storage, BigQuery, Secret Manager, and cost control.
- **Agent Platform**: the ML lifecycle on Gemini Enterprise Agent Platform (formerly Vertex AI): notebooks, AutoML, training, experiments, Feature Store, Model Registry, endpoints, pipelines, monitoring and Model Garden.
- **Claude**: coming next.

Every page has an **Essentials / Full detail** switch for beginners and advanced readers, and links to the official documentation.

## How it is built

A static site with no build step: `index.html` plus one JavaScript data file per section (`concepts.js`, `topics_*.js`). To add a topic, copy an existing one in the right `topics_*.js` file. Open `index.html` in a browser to preview.

RockTech, its customers, order numbers and prices are invented for the examples. Cloud services, model names and SDKs change often; each page links to the official docs it was checked against.
