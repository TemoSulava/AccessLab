# Contributing

## Start here

Read [README.md](README.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), [AGENTS.md](AGENTS.md) and the relevant architecture, tests and task evidence. Contributions are licensed under this repository's MIT license; retain attribution and third-party notices. Submit only work you have the right to contribute.

Use issues for reproducible bugs, feature proposals and module designs. Ask for design feedback before major changes or selecting optional v0.2 work. Maintainers can label suitable issues `good first issue` or `help wanted`; ask in the issue before starting a large change to avoid duplicate effort. There is no guaranteed review turnaround.

## Fork, branch, pull request

External contributors should fork the repository. Contributors with write access also use topic branches. **Never push directly to `main`, force-push `main`, or bypass review/checks.** See [repository governance](docs/repository-governance.md) for the protection settings and their current activation status.

```sh
git clone https://github.com/YOUR-USERNAME/AccessLab.git
cd AccessLab
git remote add upstream https://github.com/TemoSulava/AccessLab.git
git fetch upstream
git switch -c fix/descriptive-name upstream/main
```

Use README's pinned Node/pnpm versions. Before installing a changed dependency, complete the security assessment below. For the committed baseline:

```sh
pnpm audit
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
```

On Linux, browser libraries may require `pnpm exec playwright install --with-deps chromium`. Preserve unrelated local changes. Use short, descriptive commits and keep the PR focused on one problem. Push to your fork with `git push -u origin HEAD`, then open a PR targeting `TemoSulava/AccessLab:main`. Use a draft PR for work in progress. Changes requested in review belong on the same topic branch; do not create a replacement PR just to evade feedback.

Fill in the PR template with the trigger, resulting behavior, validation and limitations. A maintainer reviews and merges after CI and conversations are resolved. Automated tools must follow the same PR rules; failed PR creation is a blocker, never permission to push directly to main. Release publication requires separate maintainer authorization.

## Implementation rules

Use the public module contract and local registry: follow docs/module-author.md and templates/. Modules must validate unknown configuration, own every effect, handle AbortSignal, clean up idempotently, and tolerate disconnected targets. Keep audit violations, manual review and inspection heuristics separate. Test meaningful behavior against synthetic fixtures; never capture credentials or real personal page data into test artifacts.

No remote module loading, telemetry, backend, broad permissions, page code execution, synthetic clicking on arbitrary host pages or unsupported compliance/disability claims. Treat page strings as untrusted; use text rendering and strict schemas. Document scope limits and failures instead of silently reducing coverage. Ask maintainers for design review before permission, API, export-schema or arbitrary-page manipulation changes.

## Dependencies and verification

Before adding/updating dependencies, inspect official identity, exact version, repository, lifecycle scripts, integrity/provenance and advisories; record in [ADR 003](docs/decisions/003-dependency-security.md) or linked PR evidence and keep a frozen lockfile. No check guarantees absence of compromise. Reuse existing packages or platform APIs when suitable. Do not disable integrity checks, signatures, TLS validation or security checks to make an install pass.

Run `pnpm verify` for shared contracts/lifecycle changes and milestones; run relevant subsets for isolated changes. Package with `pnpm package` and inspect the production manifest when changing runtime permissions/builds. See [docs/testing.md](docs/testing.md) for meaningful unit, component, loaded-extension and visual tests. Documentation-only changes should verify links and examples; CI still runs the complete suite. State checks you could not run. Do not update visual expectations simply to hide a regression.

CI uses standard GitHub-hosted Linux runners and pinned official actions. No paid Marketplace action, larger runner or external paid service is required. Keep tokens read-only and never expose secrets to fork code. Discuss CI changes with the maintainer.

Human checks stay explicitly pending until a named evaluator records results. Do not publish a release or make broad accessibility claims based on automated gates alone. Use [SECURITY.md](SECURITY.md) for private vulnerability reports; issues and PRs must contain only synthetic, shareable data.
