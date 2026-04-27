# Platform Selection

This document captures platform direction and rationale for Oak Report. It is product and architecture context; see the current implementation docs for what is already present in the repo.

## Alternatives Evaluated

### Hosting and Infrastructure

| Alternative | Pros | Cons |
| --- | --- | --- |
| Heroku | Rapid deployment and a familiar workflow for CRUD apps. | Limited native AI orchestration and higher cost at larger performance tiers. |
| AWS | Broadest service catalog and mature serverless options. | Higher configuration overhead and less predictable cost for a small team. |
| Azure | Strong enterprise support and OpenAI integration. | More complex resource management for this project shape. |
| Google Cloud Platform | Strong fit for Gemini, Vertex AI, Cloud Run, and Google ecosystem access. | Requires careful IAM, billing, and deployment configuration. |

### Frontend Framework

| Alternative | Pros | Cons |
| --- | --- | --- |
| Vue | Low barrier to entry and strong performance for simple UI. | Smaller ecosystem for complex mobile camera integrations. |
| Angular | Opinionated and robust for enterprise apps. | More framework overhead than the MVP needs. |
| React with Vite | Fast iteration, broad ecosystem, and strong support for component testing. | Dependency updates require active maintenance. |

### Backend Language

| Alternative | Pros | Cons |
| --- | --- | --- |
| Node.js / TypeScript | High concurrency and one language across the stack. | Less direct fit for Python-first AI tooling. |
| Go | Excellent performance and simple deployment artifacts. | Smaller ecosystem for LLM orchestration and Pydantic-style validation. |
| Python | Strong AI/ML ecosystem and FastAPI productivity. | Lower raw throughput than Go or Node for general web logic. |

## Selected Direction

Oak Report targets a client-server architecture with:

- React and Vite for the frontend.
- Python and FastAPI for backend APIs.
- Postgres for persistent collection and catalog data.
- Gemini-oriented AI integration for image reasoning.
- Google Cloud Platform and Cloud Run as the likely deployment direction.

The current repository already uses React/Vite, FastAPI, Postgres, SQLModel, and Alembic locally. Cloud deployment and richer AI orchestration remain deployment/roadmap concerns unless documented elsewhere as implemented.

## Rationale

The main driver is the need for fast image appraisal, market grounding, and a mobile-friendly collection workflow. Python keeps the backend close to AI tooling, React/Vite supports rapid frontend development, and Postgres gives the app durable relational storage for user and collection data.
