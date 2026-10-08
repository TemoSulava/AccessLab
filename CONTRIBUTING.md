# Contributing

Start with README's pinned setup and deterministic demo. Read AGENTS.md, the implementation plan, task ledger and relevant evidence. Work in the existing isolated checkout; no additional worktree is needed. Preserve unrelated changes. Keep fixes small enough to review and include concrete behavior and appropriate validation in a PR.

Use the public module contract and local registry: follow docs/module-author.md and templates/. Modules must validate unknown configuration, own every effect, handle AbortSignal, clean up idempotently, and tolerate disconnected targets. Keep audit violations, manual review and inspection heuristics separate. Test meaningful behavior against synthetic fixtures; never capture credentials or real personal page data into test artifacts.

No remote module loading, telemetry, backend, broad permissions, page code execution, synthetic clicking on arbitrary host pages or unsupported compliance/disability claims. Treat page strings as untrusted; use text rendering and strict schemas. Document scope limits and failures instead of silently reducing coverage. Ask maintainers for design review before permission, API, export-schema or arbitrary-page manipulation changes.

Before adding/updating dependencies, inspect official identity, exact version, repository, lifecycle scripts, integrity/provenance and advisories; record in ADR 003 and keep a frozen lockfile. No check guarantees absence of compromise. Reuse existing packages or platform APIs when suitable. Run pnpm verify for shared contracts/lifecycle changes and milestones; run relevant subsets for isolated changes. Package and inspect production manifest when changing runtime permissions/builds.

Describe the trigger, behavior change, tests and limitations in the PR. Human checks stay explicitly pending until a named evaluator records results. Do not publish a release or make broad accessibility claims based on automated gates alone. The user-authorized task completion helper pushes a task branch and waits for CI before merging via PR; contributors should follow their repository review rules instead of assuming that session-specific authorization applies to them.
