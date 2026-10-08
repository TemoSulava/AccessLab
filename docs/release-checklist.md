# Private beta release checklist

Engineering beta artifacts may be built after automated gates pass. This checklist does not authorize store publication, public release, outreach or claims of validated accessibility. Record browser/OS/date/evaluator and evidence for each human gate; pending means untested.

## Automated engineering gates

- [ ] Frozen install from fresh source checkout; dependency security assessment and advisory check recorded.
- [ ] pnpm verify: lint/types, meaningful unit/components, real loaded-extension and visual tests pass.
- [ ] Production native action/activeTab, restricted-page feedback, manifest permissions and absent test hook verified.
- [ ] Lifecycle matrix including 20-cycle resources, shadow staleness, failure/retry and worker restart passes.
- [ ] Five 10k-fixture timings meet budgets with actual hardware/browser metadata.
- [ ] ZIP reproducible across repeated and clean builds; SHA-256, all bundled license notices/source form included.
- [ ] Actual GitHub CI conclusion/run URL recorded; configured but unrun CI remains pending.
- [ ] Fresh contributor follows module tutorial without editing extension internals; cleanup/reset tests pass.

See task evidence T14–T16 for completed automated results; unchecked items above are reusable checks for each future candidate, not claims that current evidence is absent.

## Manual browser/assistive-technology gates — pending

- [ ] Current stable Chrome: unpacked install, pin/action, ordinary/restricted page feedback, repeated activation, reset/close/reload and two-tab isolation.
- [ ] Keyboard-only full audit → locate/focus → fix/rerun → inspect/preview → preview/download/reset/close workflow, including native host modal recovery.
- [ ] Actual Chrome 200%/400% zoom and narrow viewport: all controls reachable, no clipped text/focus, collapse/dock recovery.
- [ ] Screen reader (record exact tool/OS/version): names/roles/tab order, live scan/stale/error messages, findings/details, preview/export disclosure and return focus.
- [ ] Forced colors/high contrast/reduced motion: visible focus, text/controls readable, no essential color-only meaning.

## User evaluation and public-claim gates — pending

- [ ] Disabled participants consent to a scoped local study; no private browsing/report data collected by default.
- [ ] Task success/confusion, actionable explanations, rendering disclaimer comprehension and failures documented with participant consent.
- [ ] Maintainer reviews unresolved issues/limitations and public wording; no compliance/disability-simulation claims inferred from automated checks.

No human evaluator or participant feedback is available in this cloud task; these gates must remain pending. Optional pointer sandbox is separate v0.2 work requiring explicit selection and a controlled local technical proposal.
