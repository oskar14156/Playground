# Playground

Public multi-project CI & testing workspace.

## 🚀 Universal CI Runner (Free Actions for Private Repos)

This repository provides an automated, free CI runner for executing test suites of private repositories using public GitHub-hosted runner minutes (0 private minutes charged).

- **Documentation & Student/Professor Guide:** [course-exercise/UNIVERSAL_CI_GUIDE.md](course-exercise/UNIVERSAL_CI_GUIDE.md)
- **AI Agent Directives & Prompt:** [AGENTS.md](AGENTS.md)
- **Workflow:** [.github/workflows/universal-ci-runner.yml](.github/workflows/universal-ci-runner.yml)

### Key Features:
- **Zero Private Billing:** Tests run on public GitHub-hosted runners (unlimited free compute).
- **Zero Limiters:** Supports unlimited repositories, unlimited tests, and any custom test commands (`npm test`, `pytest`, `cargo test`, custom AI test suites).
- **Complete Confidentiality:** Code is checked out ephemerally in runner memory, never committed or uploaded as artifacts, and wiped cleanly at job completion.

---

## Security boundary

This repository keeps only generic orchestration and intentionally public tooling. Private app implementation, app-specific test/patch logic, private source assertions, and detailed diagnostic harnesses live in the corresponding private application repositories.

For private-app jobs, a Playground workflow:

1. validates the repository token (`CI_BRIDGE_READ_TOKEN`);
2. checks out the requested private app revision into the ephemeral runner;
3. installs generic/manifest dependencies;
4. invokes the declared test command;
5. publishes clean test summaries without leaking source code;
6. completely deletes the private workspace from runner disk.

---

## Required secret

Private-repository workflows use `CI_BRIDGE_READ_TOKEN` to read the corresponding private repository at runtime.
