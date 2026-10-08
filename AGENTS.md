Build AccessLab according to AccessLab-Implementation-Plan.md.
Read docs/tasks/status.json and dependency evidence before each task.
Execute ready tasks in dependency order: implement, test, browser-verify, record evidence, complete.
Preserve user changes. Never weaken acceptance tests or invent human/remote CI results.
No backend, telemetry, broad host permissions, remote code, or AI services.
Use strict message schemas. Treat page strings as untrusted. Never export sensitive values.
Every effect needs idempotent cleanup. Preserve generation/reset semantics across races.
Record unsupported scope explicitly. Continue until finished or concretely blocked.
Push each completed task to the implementation branch, as authorized by the user.
Before adding/updating any dependency, inspect official package/version identity, source, lifecycle scripts, integrity/provenance and known advisories. Record the assessment; never disable verification. See docs/decisions/003-dependency-security.md.
After each completed task, push and use a PR to merge into main, as authorized by the user. Respect required repository checks/reviews. If GitHub API access is externally blocked, record the pending PR/merge and continue independent implementation; retry after configuration changes.
If PR creation is unavailable, user authorizes direct fast-forward push to main after each completed task. Fetch/check ancestry first; never overwrite unrelated remote changes.
