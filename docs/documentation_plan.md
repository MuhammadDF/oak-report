# Oak Report — Documentation Plan

Our users fall into two groups: **End Users** (Pokémon collectors using the app) and **Client / Administrator** (the team receiving the project at handoff and anyone deploying it later). Because Oak Report is a simple mobile-first web app — sign in, scan a card, see the appraisal, save it — we don't need long written manuals. The app itself should teach users how to use it, and the technical side can be covered by the repo plus a live walkthrough.

### End Users

- **Short in-app tutorial** on first launch showing the main flows (scan, appraise, save to collection).
- **Intuitive UI** with tooltips and clear labels so users rarely need to look anything up.
- **Clear error messages** for problems like denied camera access, unreadable cards, or network failure, so the user always knows what went wrong and what to do next.

*Why this is appropriate:* collectors are not going to read a manual before scanning their first card. A short tutorial gets them oriented, the UI carries them through day-to-day use, and helpful errors cover the moments when something breaks.

### Client / Administrator

- **Updated `README.md`** covering how to set up the project, configure the `.env` file, run it locally or with Docker, deploy to **Google Cloud Platform (Cloud Run)**, and the **GitHub Actions CI/CD pipeline** that automatically builds and deploys the app on merge.
- **Supporting docs in `/docs/`** that give background and context for the project — the goals, specs, user stories, and design decisions behind how things are built — so future maintainers understand the *why*, not just the *how*.
- **Short demo** with the client at handoff, walking through the app and the setup steps live so they can ask questions in the moment.

*Why this is appropriate:* the client's technical team needs something they can refer back to (the README), but a live demo is faster and clearer than any document for explaining how the pieces fit together.
