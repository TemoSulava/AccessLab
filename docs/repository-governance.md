# Repository governance

## Policy and activation status

All changes to `main` go through a pull request, passing CI and maintainer review. This applies to collaborators, maintainers and automated agents. There is no direct-push fallback. CODEOWNERS routes review to `@TemoSulava`; ownership alone does not enforce review or block pushes.

On 2026-10-08, GitHub reported this public repository's `main` as unprotected and its ruleset list as empty. The current integration returns HTTP 403 (`Resource not accessible by integration`) for branch protection administration. The committed configuration is ready, but enforcement must be enabled by an owner using Repository Settings or an appropriately scoped credential. Until then, GitHub does not technically block collaborators with write access from pushing directly; project policy still prohibits it. Keep external contributors on forks and grant write access sparingly.

## Enable free built-in protection

Public repositories can use these branch protections on GitHub Free. No Marketplace app, paid plan or custom Action is needed. In **Settings → Branches → Add branch protection rule**, target `main` and enable:

- Require a pull request before merging, with one approving review and code-owner approval.
- Dismiss stale approvals when new commits are pushed.
- Require status check `verify` from **Verify and package**, and require the branch to be up to date before merging.
- Require conversations to be resolved.
- Do not allow bypassing the above settings (including administrators).
- Keep force pushes and branch deletions disabled.

Do not add a bypass actor or require the external GitGuardian check. The existing security app is not a dependency of the contributor workflow. GitHub does not let an author approve their own PR: maintainer-authored PRs need another eligible code owner. Add trusted maintainers with write access to CODEOWNERS as the team grows. Do not temporarily weaken protection to merge your own PR.

Alternatively, from the repository root, an owner with repository Administration write permission can apply the reviewed configuration:

```sh
gh api --method PUT repos/TemoSulava/AccessLab/branches/main/protection \
  --input .github/main-protection.json
gh api repos/TemoSulava/AccessLab/branches/main/protection
gh api repos/TemoSulava/AccessLab/branches/main --jq '{name, protected}'
```

The PUT replaces classic protection for this branch. Review any existing settings first rather than overwriting stronger rules. Confirm the required check, review settings, administrator enforcement and disabled force pushes/deletion in the response. A committed JSON file is not proof that protection is active. Once applied, update this activation-status section with the verified result. Admins can still edit settings; periodically inspect protection and collaborator access.

## CI without paid services

The repository is public and `.github/workflows/verify.yml` uses standard `ubuntu-24.04` runners, which GitHub provides free for public repositories. All four actions are SHA-pinned official actions (`actions/checkout`, `pnpm/action-setup`, `actions/setup-node`, `actions/upload-artifact`). No paid Marketplace action, larger runner, deployment service or new dependency is introduced. GitHub artifact storage has separate quotas; retain the current short retention periods and do not enable paid overages. Reassess quotas before making the repository private.

In **Settings → Actions → General**:

- Allow only the official actions used by the workflow (including `pnpm/action-setup`) and require full SHA pinning if that setting is available.
- Set default workflow token permissions to read repository contents; disable workflows creating/approving PRs.
- Require approval for all outside collaborators' fork workflow runs. Review the workflow diff before approving; never approve blindly.
- Do not send secrets or write tokens to fork PRs. Keep `pull_request`, read-only job permissions, and `persist-credentials: false`; do not introduce `pull_request_target` execution of PR code.

Owner-only settings are not stored in workflow YAML. The integration also returns 403 for Actions settings; verify them in the UI. Required `verify` must run for every PR, including docs changes: do not add path filters that leave required checks pending. CI success supports review; it does not establish human accessibility validation.

## Maintainer review

Review the problem, scope, privacy/permissions, effect cleanup, meaningful tests, dependency assessments and documentation. Resolve feedback before merging and retain the audit trail in the PR. Give contributors specific, respectful requests. A reviewed security or dependency change may need additional design discussion. Releases remain separate from PR merges and must follow the release checklist.

Enable GitHub private vulnerability reporting in **Settings → Security** if available, and verify the private reporting link in SECURITY.md. Use Issues for public, synthetic bug reports and feature/module proposals. Use the Code of Conduct for participation expectations; avoid collecting personal disability or browsing data in project artifacts.
