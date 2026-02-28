# pokemon
Pokemon Appraisal App

## D2: Design Document

### Platform Selection

#### Phase 1: Evaluation of Alternative Platforms
To identify the most effective architecture, the following technologies were evaluated based on scalability, AI integration, and development velocity.

##### 1. Hosting & Infrastructure (PaaS)

| Alternative | Pros | Cons |
| --- | --- | --- |
| Heroku | Rapid deployment; excellent for standard CRUD apps. | Limited native AI orchestration; higher cost for performance tiers. |
| AWS (Amazon Web Services) | Deepest feature set; Lambda is highly mature for serverless. | High configuration overhead; pricing can be unpredictable for startups. |
| Microsoft Azure | Strong enterprise support; seamless integration with OpenAI. | Complex UI/UX for resource management; higher latency for non-OpenAI models. |
| Google Cloud Platform (GCP) | **Selected.** Best-in-class AI tools; superior serverless integration for Gemini and Vertex AI. | Requires specific expertise in IAM and project billing structures. |

##### 2. Frontend Frameworks

| Alternative | Pros | Cons |
| --- | --- | --- |
| Vue.js | Low barrier to entry; highly performant for simple UIs. | Fewer libraries for complex mobile-web camera integrations. |
| Angular | Opinionated and robust; ideal for large enterprise scale. | Significant boilerplate; overkill for an MVP-focused app. |
| React (Vite) | **Selected.** Industry-standard ecosystem; excellent responsiveness and fast refresh via Vite. | Frequent library updates can cause dependency friction. |

##### 3. Backend & Language

| Alternative | Pros | Cons |
| --- | --- | --- |
| Node.js (Typescript) | High concurrency; single-language stack (JS/TS). | Less mature than Python for high-level AI/ML library support. |
| Go (Golang) | Superior performance; compiled for high-speed execution. | Smaller ecosystem for LLM orchestration and Pydantic-style data validation. |
| Python | **Selected.** Native support for AI frameworks; required for Google ADK and agentic logic. | Slower execution for standard web logic compared to Go or Node. |

#### Phase 2: Final Platform Selection & Justification
The Oak Report will utilize a serverless client-server architecture optimized for high-speed image inference and live market grounding.

**Strategic Justification**

The primary driver for the platform selection is the unique partnership with our client, who provides direct access to the Google Cloud Ecosystem. This allows the team to leverage premium enterprise-grade tools, specifically Vertex AI and Google Search Grounding, at effectively zero cost.

By centralizing the project on Google Cloud Platform, we eliminate the budget constraints typically associated with high-frequency AI inference and live search APIs. This enables a more robust “Proxy/Fake Guard” logic that requires multiple visual passes, which would be cost-prohibitive on other platforms like AWS or Azure.

> Note: Most of these decisions prioritize seamless integration between the AI model (Gemini) and the hosting environment (Cloud Run). Using a unified Google ecosystem reduces glue code and minimizes latency for real-time appraisals.

**Final Stack Components**

- Frontend: React (Vite) + Tailwind CSS to deliver fast, camera-friendly UI interactions.
- Backend: Python to manage complex agentic reasoning and Pydantic data schemas.
- AI/Inference: Gemini 2.0/3 Flash (Vertex AI) for visual reasoning with rapid responses.
- Database: Firestore for a real-time memory bank that tracks price trends and card scan history.
- Hosting: GCP Cloud Run to provide a scalable, serverless runtime that remains maintainable post-handoff.

**Documentation & References**

- Google ADK Documentation: Guidelines for building agentic workflows.
- Vertex AI Search Grounding: Documentation for live web-grounded market data.
- TCG Analytics Reference: Case studies on visual detection of counterfeit collectibles.

This platform configuration ensures that the Oak Report is not only a functional MVP but a cost-efficient, production-ready tool that maximizes the technological advantages provided by the project’s stakeholders.
