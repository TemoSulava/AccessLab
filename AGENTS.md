Build AccessLab according to AccessLab-Implementation-Plan.md.
Read docs/tasks/status.json and dependency evidence before each task.
Execute ready tasks in dependency order: implement, test, browser-verify, record evidence, complete.
Preserve user changes. Never weaken acceptance tests or invent human/remote CI results.
No backend, telemetry, broad host permissions, remote code, or AI services.
Use strict message schemas. Treat page strings as untrusted. Never export sensitive values.
Every effect needs idempotent cleanup. Preserve generation/reset semantics across races.
Record unsupported scope explicitly. Continue until finished or concretely blocked.
Work on a topic branch and submit a pull request into main. Never push directly to main.
Before adding/updating any dependency, inspect official package/version identity, source, lifecycle scripts, integrity/provenance and known advisories. Record the assessment; never disable verification. See docs/decisions/003-dependency-security.md.
Respect required repository checks and reviews. If PR creation or merge is blocked, leave the branch and report the blocker; never fall back to a direct push or bypass protections.
Contributor policy is in CONTRIBUTING.md and maintainer settings are in docs/repository-governance.md. Session-specific authorization does not grant contributors merge or release authority.
