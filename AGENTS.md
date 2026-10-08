Build AccessLab according to AccessLab-Implementation-Plan.md.
Read docs/tasks/status.json and dependency evidence before each task.
Execute ready tasks in dependency order: implement, test, browser-verify, record evidence, complete.
Preserve user changes. Never weaken acceptance tests or invent human/remote CI results.
No backend, telemetry, broad host permissions, remote code, or AI services.
Use strict message schemas. Treat page strings as untrusted. Never export sensitive values.
Every effect needs idempotent cleanup. Preserve generation/reset semantics across races.
Record unsupported scope explicitly. Continue until finished or concretely blocked.
Push each completed task to the implementation branch, as authorized by the user.
