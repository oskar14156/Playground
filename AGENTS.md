# Public Playground agent policy

Scope: everything in this public repository. Read this file before editing workflows or dispatching Actions.

1. Work on a dedicated project branch. Never overwrite unrelated projects, the 66 existing branches, or their workflows. Prefer focused commits and pull requests.
2. For the university example, only modify `course-exercise/` and `.github/workflows/course-ten-tests.yml` unless the user expressly expands the scope.
3. Do not check out, transfer or build private app source in public GitHub-hosted Actions just to bypass private-repository billing. Do not add private-repo credentials or secret-bearing source snippets to the public workspace.
4. Public workflows may run the public teaching project's own source and fixtures. No private app source, private build artifact, private diagnostic output, or store credential is allowed in public logs/artifacts.
5. Keep public CI limited to the repository-associated software and within GitHub Actions service terms. Public runners are not unlimited compute.
6. Do not claim public pricing fixture tests prove a real private app passes. A private codebase requires its own actual test run in a suitable environment.
7. Keep all new workflows minimal-permission (`contents: read`), non-privileged and with explicit timeouts. Avoid dangerous `pull_request_target` / untrusted code + secrets combinations.
8. On an agent handoff, report exact SHA, changed paths, real run URL/results (or BLOCKED), and any manual Actions enablement still required.

These instructions are repository-local; they cannot automatically configure agents working in other private repos. Copy equivalent guidance to each repository's own instruction files.

For the exercise, read [course-exercise/README.md](course-exercise/README.md).
