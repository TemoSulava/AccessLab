# AccessLab — implementation specification and AI execution plan

Version: 1.0 • Prepared: 8 October 2026 • Status: specification, not implemented

## 1. Product decision

Build an open-source Chrome extension that helps frontend developers discover, inspect, explain, and reproduce accessibility barriers on the current webpage. Combine a proven automated audit engine with focused visual inspection tools. Make individual modules easy for contributors to build.

Positioning: **“Find accessibility barriers. Inspect the cause. Verify the fix.”**

Visual previews illustrate selected rendering effects; they do not reproduce a person's lived experience or establish accessibility compliance. Include disabled people in product evaluation. Avoid disability “scores,” claims to simulate cognition, and fake screen readers.

Primary user: a frontend developer testing a page they own. Secondary users: QA engineers, designers, accessibility specialists, students. The extension also supports inspecting public pages with explicit activation.

Success for v0.1: a developer installs locally, opens a deliberately broken demo, runs an audit, locates one issue, reads a useful explanation, fixes the demo, reruns the audit, and sees the issue disappear. They can repeat this using the keyboard. Disabling AccessLab removes its effects.

## 2. Scope and release boundaries

### v0.1 — complete useful foundation

- Manifest V3 Chrome extension, activated explicitly through the extension action.
- React inspection panel injected into the top-level page, inside its own Shadow DOM.
- Locally bundled axe-core scan, results, rule explanation, target highlight, and JSON/Markdown export.
- Observed keyboard focus trail and current-focus indicator.
- Target-size inspection with clear heuristic/WCAG distinction.
- Grayscale, color-vision approximation, and adjustable blur previews; one visual preview at a time.
- Reliable reset, tab isolation, navigation invalidation, cancellation, and failure handling.
- Local fixtures/demo, real-extension integration tests, CI, contributor guide, documented module API.
- No accounts, server, database, telemetry, cloud AI, subscription, or remote executable code.

### v0.2 — only after v0.1 gates pass

- Packaged experimental pointer-precision sandbox, not arbitrary-page cursor control.
- More inspection modules, user-approved presets, localization infrastructure.
- A library/CLI reusing report schemas and axe configuration for developer-owned pages.
- Broader iframe support after a separate permissions and architecture proposal.

### Later, based on demonstrated demand

Firefox adapter, CI annotations, DevTools panel, React-specific hints, accessible report UI, team workflows. Do not prebuild a multi-service platform.

Excluded: automatic site repair, real screen-reader emulation, authentic dyslexia/cognitive impairment simulation, screen capture, collecting page content remotely, third-party runtime plugin marketplace, issuing WCAG certification. A zero-finding result must say “No automated issues found in the scanned scope; manual checks remain.”

## 3. Technology and repository

Use TypeScript strict mode, React, WXT for Manifest V3 packaging, pnpm workspaces, Vitest, React Testing Library, Playwright, and axe-core. Use plain scoped CSS/CSS modules and CSS variables for the panel; avoid a large component framework initially. Prefer native controls. No Redux or backend is needed; a reducer plus module manager is sufficient.

At bootstrap, confirm supported Node/pnpm/WXT/React versions against official docs and engine fields; pin the selected versions, commit pnpm-lock.yaml, record decisions in docs/decisions/001-toolchain.md. Do not use “latest” in CI. Verify the actual generated entrypoint filenames/manifest rather than assuming framework output paths.

Proposed layout:

```text
apps/extension/
  entrypoints/background.ts
  entrypoints/content.ts
  src/panel/
  src/messaging/
  src/runtime/
  src/export/
  wxt.config.ts
apps/demo/
  src/scenarios/
packages/contracts/
packages/core/
packages/modules/
  src/axe-audit/
  src/focus-trail/
  src/target-size/
  src/visual-preview/
tests/extension/
tests/fixtures/
docs/decisions/
docs/tasks/
docs/evidence/
AGENTS.md
CONTRIBUTING.md
SECURITY.md
LICENSE
```

Dependency direction: contracts → core → modules → extension. Demo and tests consume public interfaces. Core must not import React or Chrome APIs. Keep modules in one package initially; split publishable packages only when justified.

Adopt MIT for project-owned code and preserve third-party notices/licenses, including axe-core's applicable license. Do not assume MIT relicenses dependencies. AccessLab is a working name: check naming before publication, not before local development.

## 4. Browser architecture

### Activation

1. User presses extension action; background checks for a supported tab URL.
2. Background injects bundled content script into the top frame using scripting and activeTab.
3. Content script creates a singleton controller and Shadow DOM panel; repeated activation focuses/toggles the existing panel instead of adding another.
4. Page-local controller owns effects, scan state, and cleanup. Background routes activation only; it is not an always-running process or source of truth.
5. A newly loaded document starts inactive and requires activation. SPA URL changes invalidate reports without reinjecting duplicate controllers.

Initial permissions: activeTab, scripting, storage. No broad host_permissions, tabs permission, debugger, downloads, or all-sites static content script. Ordinary Blob downloads suffice for exports if confirmed in browser tests. If a new permission becomes necessary, document evidence and tradeoff before adding it.

Use isolated-world injection. The DOM is shared even though JavaScript globals are isolated; the page can see/remove injected DOM. Shadow DOM is style isolation, not a security boundary. Do not expose a page-window command channel. Do not use eval, remote scripts, or MAIN-world bridges for v0.1.

### Scope declaration

v0.1 scanning targets the top document. For the initial axe scan, exclude iframe elements so the bundled engine does not silently claim unsupported frame coverage; report the number of excluded frames. Treat closed shadow roots as inaccessible; report this as a general limitation because they cannot be comprehensively counted. Test and document actual open-shadow coverage of the chosen axe version. Native focus handling in open shadow trees should use composed events where available.

Restricted URLs (browser internal pages, extension store, built-in viewers) show an actionable extension-action error. File URLs are unsupported in v0.1. Injection errors must not be reported as empty scans.

### State and concurrency

- Preferences: chrome.storage.local, validated and versioned; no reports, DOM snippets, form values, or browsing history persisted.
- Active modules/results: in memory in each document controller. No cross-tab sharing.
- Report states: idle, scanning, complete, stale, cancelled, error.
- Each scan has an increasing generation ID. Reset/new scan/navigation invalidates older results even if an underlying operation cannot stop immediately.
- One audit at a time. Disable duplicate Run while busy; Cancel invalidates publication. Configure an audit timeout and show a retryable error.
- Reconnecting after background suspension asks the content controller for current state.
- Every Chrome message has schemaVersion, requestId, allowlisted type, validated payload and bounded size. Validate sender extension identity and expected tab/frame for messages from content scripts. Reject malformed commands without throwing.

Do not equate successful message delivery with successful activation: use an acknowledgement and clear timeout/error UI.

## 5. Contracts and module lifecycle

Create a small versioned local module interface. Modules are reviewed source bundled at build time, not downloaded executable plugins.

```ts
export type ModuleKind = 'audit' | 'inspection' | 'preview';
export type Cleanup = () => void | Promise<void>;

export interface ModuleContext {
  document: Document;
  signal: AbortSignal;
  effects: EffectRegistry;
  overlay: OverlayService;
  report: (event: ModuleEvent) => void;
}

export interface AccessLabModule<Config> {
  id: string;
  apiVersion: 1;
  kind: ModuleKind;
  configSchema: RuntimeSchema<Config>;
  capabilities: readonly string[];
  activate(ctx: ModuleContext, config: Config): Promise<Cleanup>;
}
```

RuntimeSchema, ModuleEvent, EffectRegistry, and OverlayService are project-defined types; implement them in T03–T05. An audit adapter may additionally expose run(config, signal) returning a report; do not force long-running audits to behave like permanent effects.

Requirements:

- Activation either completes and registers disposal or rolls back partial work.
- EffectRegistry records cleanup immediately when listeners, observers, styles, overlays, timers, or animation frames are created. It unwinds in reverse order.
- dispose/reset is idempotent. Cleanup continues after a single disposer throws and aggregates errors.
- Updating configuration tears down the previous instance before creating another.
- Exclusive group visual-preview allows only one rendering preview at a time.
- Module failure does not disable unrelated modules; panel displays a recoverable status.
- AbortSignal stops cancellable work. Generation IDs suppress noncancellable late responses.
- Avoid modifying host inline styles. Use extension-owned style elements and namespaced attributes where needed. Remove only resources owned by AccessLab; preserve edits made by the host while a mode was active.
- Include contract tests for double activation, reset during activation, partial failure, cancellation, configuration replacement, repeated disposal, and reverse cleanup.

## 6. UI specification

Compact docked panel, initially right side, movable between right and left with a button. It overlays rather than resizing the host layout. Width approximately 360 CSS pixels on desktop; responsive width bounded by viewport. Collapsible with an obvious reopen control. Solid panel background; high contrast; text and controls usable at 200% zoom.

Three tabs: Audit, Inspect, Preview. Shared header contains page scope, status, Reset, and Close. Footer contains scope limitations and a link to local documentation.

Audit: Run/Cancel, last scan time, scope, severity filters, findings and needs-review sections, empty/error/stale state, issue details, Locate, Export. Avoid overall accessibility score. Scan progress is indeterminate unless actual progress exists.

Inspect: focus trail toggle, clear trail, target threshold selector (24 or 44 CSS pixels), explain measurement, inspect hovered/selected target via explicit mode.

Preview: named approximation, strength controls where applicable, limitations, disable button. No default preview.

Panel keyboard behavior: native tab order, visible focus, labels for all inputs, no focus theft during a scan, bounded live announcements, Escape closes panel only while focus is inside it (or inside AccessLab-owned modal). Do not install global shortcuts that interfere with host applications. Opening remembers the previously focused page element; closing restores it if connected and focusable. Nonmodal panel does not trap focus. Panel controls and overlay labels must be excluded from host-page findings.

Locate scrolls the target into view only after user request; outlines it without activating it. Announce when an element disappeared. An optional “Focus target” action is separate from Locate. Render all page-derived strings as plain text; no untrusted HTML insertion.

## 7. Feature-level behavior

### Automated audit

Bundle axe-core locally and run an explicitly recorded configuration for supported WCAG 2.2 A/AA tags. Verify available tags in the pinned engine. Keep configuration centralized; do not write replacement rules for issues axe already supports.

Audit the baseline page: temporarily suspend AccessLab visual previews and target overlays; retain the panel excluded from the scan. Restore previously active effects in finally only if their activation generation is still current. Never restore a preview after the user reset it during a scan. Test whether previews change findings and verify baseline behavior.

Normalize violations and incomplete results separately. Include engine name/version, tags, viewport, scan timestamp/duration, scope, excluded frames, scan generation, and page revision. Passes may be summarized but are not required in the panel. No compliance claim.

A finding includes rule ID, severity from engine (nullable), description, help URL, WCAG tags, review status, target locator, redacted text description, explanation, and a contextual fix suggestion. Explanations can be curated templates for common rules with generic fallback and official help URL. Do not promise generated code is universally correct.

Run a bounded MutationObserver while active. Relevant non-AccessLab subtree mutations mark completed reports stale; ignore owned overlays/panel. Also detect URL differences on a low-frequency timer while active plus popstate/hashchange; avoid monkeypatching framework history globals. Rescanning remains explicit. Changes during a scan mark the resulting snapshot stale. Skip endless auto-rescans on live apps.

Finding identity is stable within a scan, derived from rule + target + frame/shadow path + duplicate index. A DOM locator can fail after changes: maintain session references only while valid and show unavailable rather than highlighting the wrong element. Exported locators are descriptive, not guaranteed portable replay commands.

### Target-size inspection

Measure visible candidate link/button/input/interactive-role bounding rectangles in CSS pixels. Exclude disabled, hidden, and AccessLab controls. Include selector/path and dimensions; cap initial candidates at 1,000 and report truncation. Use sampled/batched work rather than measuring the entire DOM on each pointer move.

24×24 is the WCAG 2.2 AA minimum criterion's size reference, with spacing and other exceptions. 44×44 is an optional larger-target reference tied to AAA guidance. A bounding-box check alone is a heuristic and must not label all smaller controls as WCAG failures. Mark “small target — inspect size, spacing and exceptions.” For valid automated rule findings, preserve axe's own rule semantics. Document inline links, overlap, equivalent controls, user-agent controls, transforms and irregular shapes as limits. Test 23/24/25 and 43/44/45 boundary cases, adjacent spacing, zoom, and display:none.

### Focus trail

Observe actual focus navigation; display numbered visited targets and a current-focus outline. Call it “Observed focus trail,” not predicted complete focus order. Do not prevent clicks or synthetic-tab through arbitrary apps. Avoid inferring “keyboard accessible” from tabindex alone. Record only target identifiers/types, never typed values.

Ignore AccessLab controls in page trail. Support focus inside tested open shadow trees and show frame limitation. Recalculate outline on scroll/resize; discard disconnected elements. Provide Clear. Demo includes positive tabindex, radio group, modal, hidden controls and SPA insertion. Verification uses actual Playwright keyboard events and a manual keyboard walkthrough.

### Visual previews

- Grayscale: illustrate color dependency; not a color-blindness simulation.
- Color-vision approximation: protanopia, deuteranopia, tritanopia using a documented published matrix/algorithm and attribution. T12 begins with a short spike selecting the algorithm and verifying filter behavior.
- Blur: adjustable rendering effect, labeled approximation; not a representation of all low-vision conditions.

Prefer extension-owned scoped CSS/filter resources. Do not reparent host content or apply filters to html/body if that changes fixed positioning or filters the panel. Test a fixed header, canvas, sticky content and an existing host filter. If a robust whole-page implementation is unavailable, offer a clearly delimited preview region or mark unsupported layout; do not ship silent breakage. Panel and Reset remain unaffected. Compare known color swatches with deterministic tolerance, then visually inspect screenshots. Respect reduced motion; no flashing.

### Export

JSON schema v1 plus Markdown summary. Export by explicit user action, no automatic persistence. Default URL removes query and fragment; page title and text/HTML snippets omitted by default. Do not export input values, cookies, tokens, whole HTML, or screenshots. Locators can contain identifiers: preview the export and explain that it may still reveal page structure. No outbound transmission.

Fields: schemaVersion, product/engine versions, sanitized page origin/path, viewport, scan timing, scope/limits, staleness, violations, needsReview, inspection observations when selected. Do not mix heuristic observations with automated violations. Escape Markdown content and JSON strings safely. Test malicious strings, large reports, duplicate targets, null impact and missing elements. Reject unsupported import/report versions; report import is deferred.

## 8. Test and verification strategy

### Layers

1. Unit: schemas, report normalization/redaction, numeric boundaries, cleanup, generation cancellation, filter selection and finding IDs.
2. Component: controls, keyboard interaction, state rendering, announcements and escaping. DOM-only tests do not establish layout correctness.
3. Real extension E2E: built unpacked extension inside Playwright persistent Chromium context using channel chromium. Real injection, background messaging, Shadow DOM panel, bundled audit, export and cleanup. Never substitute a mocked web app for the extension suite.
4. Visual: baseline/active/reset screenshots of deterministic local fixtures, checked for panel clarity and host layout regressions. Snapshots must be intentionally reviewed; never blindly regenerate them to resolve failures.
5. Human/user evaluation: current stable Chrome install, keyboard workflow, a real screen reader, and feedback from disabled participants. AI browser automation cannot claim this happened.

### Test fixtures

Create local deterministic pages with paired broken/fixed cases: unlabeled controls; missing alt; contrast; small/closely spaced targets; focus traps and repaired modal; positive tabindex/radio groups; sticky/fixed header; existing CSS filters; transform/zoom; nested open shadow root; iframe marker; live SPA updates; hostile CSS; text containing HTML/script-like content; large DOM (10,000 nodes); slow/failing audit stub in contract tests.

Each fixture defines expected rule IDs/known observations and expected exclusions. Assert known findings rather than total counts across engine versions. Include assertions that a known-good control is not flagged by the custom heuristic and that the paired fix removes the relevant issue.

### Lifecycle matrix

Activate twice; enable-disable 20 times; reset while scanning; close while effects active; same-tab reload; SPA navigation; two tabs with different modes; removed target; background suspension/restart; preview on then audit; audit fails then rerun; module throws during cleanup; unsupported URL; oversized/malformed message. All must produce an intentional state and no leftover AccessLab resources.

Close means reset/dispose and remove panel; reopen starts with no active effects. Reload recovery is baseline and no autoactivation. Framework extension hot-reload/uninstall may leave content resources temporarily: document hard reload as recovery, and test what the chosen toolchain can actually clean up.

### Performance budgets (project targets, not universal claims)

On recorded CI hardware/Chromium, over five runs: panel activation median ≤500 ms and worst ≤1.5 s on the 10k-node fixture; audit timeout 30 s with responsive Cancel; idle inspection schedules no repeated full-page scans; focus overlays use requestAnimationFrame batching and no unbounded listeners. Set audit finding display pagination and cap target overlay rendering at 200, stating omitted count. All findings may remain exportable within a documented payload budget (initial 5 MiB). Report truncation instead of silent drops.

Measure owned resource counts across 20 cycles; return to baseline. Heap diagnostics are optional and do not replace observable lifecycle checks. If budgets fail, profile, fix or document a justified changed budget in an ADR; do not assert compliance without measurements.

### Required project commands

Implement these scripts and ensure they work from a fresh checkout:

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:components
pnpm build
pnpm test:extension
pnpm test:visual
pnpm verify
pnpm package
```

verify runs lint, typecheck, unit, component, build, extension and visual gates in order, exiting nonzero on failure. package builds/validates the production artifact and excludes debug/test sources. Document browser installation command and native CI requirements. test:visual produces inspectable artifacts; human screenshot-review status is separately recorded. An exit code cannot certify that a person reviewed images.

## 9. Ordered implementation backlog

Every task uses the execution loop in section 10. Dependencies are hard gates. Tasks are small enough for one AI session where possible; split oversized tasks before starting, preserving IDs (e.g. T07a/T07b). Estimates are omitted until a toolchain spike demonstrates actual effort.

### T01 — bootstrap and decisions

Depends: none.
Deliver: workspace, pinned toolchain, minimal WXT production build, demo server, baseline scripts, lockfile, MIT project license/third-party notices, ADR, AGENTS.md and task ledger.
Accept: clean install/typecheck/build succeed; manifest is MV3 with only planned permissions; no application logic yet.
Verify: run fresh install/build; inspect generated manifest and package file list. Record versions and output path.

### T02 — real-extension testing harness

Depends: T01.
Deliver: persistent Chromium fixture loading built extension, local fixture server, worker/extension-ID discovery, artifact capture, test cleanup.
Accept: a production-bundled smoke feature injects a unique marker in the active local fixture, with no duplicate marker on repeated activation; test fails if extension is absent.
Verify: exercise actual action authorization where possible. If automation cannot click the browser toolbar, use a documented test-only activation mechanism restricted to localhost in a separate test build and add a current-Chrome manual action gate. Do not grant production all-sites permissions just for tests. Confirm test and production differences explicitly.

### T03 — contracts and messages

Depends: T02.
Deliver: runtime schemas, config versioning, typed commands/acknowledgements, report schema v1, explicit error codes.
Accept: valid messages roundtrip, invalid/oversized/wrong-version inputs are rejected, missing response times out clearly.
Verify: unit tests and real worker/content message test; adversarial payload tests.

### T04 — module manager and effects registry

Depends: T03.
Deliver: local registry, lifecycle, exclusive groups, generation cancellation, cleanup error aggregation.
Accept: activation failure rolls back; repeated reset leaves no owned resources; late audit result is discarded.
Verify: lifecycle contract suite plus browser listener/DOM ownership checks.

### T05 — overlay and page controller

Depends: T04.
Deliver: singleton injection, Shadow DOM mount, overlay service, scroll/resize batching, bounded mutation invalidation, URL-change handling.
Accept: hostile host CSS does not style panel; overlays align; SPA mutations mark stale; repeated activation stays singular.
Verify: transformed/sticky/scroll/shadow fixtures; two-tab isolation; remove target mid-highlight.

### T06 — accessible panel shell

Depends: T05.
Deliver: three tabs, empty/loading/error states, collapse/dock/reset/close, accessible native controls.
Accept: full keyboard flow; nonmodal focus behavior; Reset works; Close removes all effects and restores focus when valid; 200% zoom usable.
Verify: component suite, axe scan of the panel separately, extension keyboard walkthrough and screenshots. Record screen-reader check as pending human validation if unavailable.

### T07 — axe audit adapter

Depends: T06.
Deliver: bundled engine, centralized tags/scope, scan/cancel/timeout, baseline-preview suspension protocol, result normalization.
Accept: known missing-label fixture is detected and fixed pair removes finding; incomplete is separate; iframe exclusion/scope stated; reset prevents late publication.
Verify: E2E broken/fixed scan and unit delayed-failure tests. Confirm no remote engine load and no AccessLab UI finding.

### T08 — finding details and locate

Depends: T07.
Deliver: severity/review filters, issue list/detail, curated explanations, robust target resolution, locate outline.
Accept: details render unsafe strings as text; locate identifies correct duplicate target; disappearing target gives unavailable state; scan results do not steal focus.
Verify: real page interaction, hostile strings, repeated targets, DOM replacement, screenshots.

### T09 — target-size inspector

Depends: T08.
Deliver: visible target discovery, bounded measurement, thresholds, heuristic explanation and overlay labels.
Accept: threshold boundaries correct; exceptions disclosed; not represented as compliance failures; capped results disclose omitted count.
Verify: real-layout boundaries/spacing/transforms/zoom tests and fixed/hidden controls. Test 10k-node candidate budget.

### T10 — observed focus trail

Depends: T09.
Deliver: composed focus tracking, current outline, numbered visits, clear trail.
Accept: actual Tab/Shift+Tab visits observed; AccessLab controls excluded; no input content stored; native page keyboard behavior unchanged.
Verify: modal/radio/positive-tabindex/open-shadow cases with real keyboard events; reset removes listeners/outlines.

### T11 — grayscale and blur previews

Depends: T10.
Deliver: filter spike ADR, selected nonbreaking strategy, bounded strength control, exclusive visual group, limitation copy.
Accept: panel remains usable; fixed/sticky/layout remain correct; disabling restores host effects while preserving concurrent host changes.
Verify: baseline/active/reset screenshots, existing filter and modal fixtures, preview → audit baseline → restore, reset during scan.

### T12 — color-vision approximations

Depends: T11.
Deliver: attributed matrix/algorithm, three named modes, locally bundled resources, plain explanation.
Accept: known swatches match expected transforms within chosen tolerance; preview remains reversible and does not silently claim medical realism.
Verify: numeric reference tests, real-browser screenshots and algorithm ADR. If browser filter path is unreliable, ship documented region preview or defer this module explicitly.

### T13 — JSON and Markdown export

Depends: T12.
Deliver: redaction, schema v1 serialization, preview and user-triggered Blob download.
Accept: query/fragment and sensitive field content absent; observations separated from violations; stale status/scope included; hostile Markdown safe.
Verify: parse actual downloaded JSON/Markdown in E2E; large report budget and sanitized URL fixtures.

### T14 — reliability and performance pass

Depends: T13.
Deliver: complete lifecycle matrix, restricted-page feedback, performance measurements, bounded rendering/payloads, error recovery.
Accept: all lifecycle gates pass; no owned-resource growth after 20 cycles; panel responsive on fixture; documented unsupported coverage.
Verify: production build E2E, recorded timings/hardware, current-Chrome manual install/action smoke. Fix discovered regressions before proceeding.

### T15 — CI and release packaging

Depends: T14.
Deliver: GitHub Actions workflow with least token privilege, frozen install, browser dependencies, verify, test artifacts on failure, production ZIP and checksum script.
Accept: clean checkout passes required gates; build artifact has no test activation path/remote code/extra permissions; package is reproducible from locked source.
Verify: local clean-checkout rehearsal; actual CI run when repo remote is available. Mark remote CI pending if unavailable, never fabricate a run URL.

### T16 — contributor foundation and private beta

Depends: T15.
Deliver: README quick start/demo, architecture, module author tutorial, new-module template, test guide, issue/PR templates, security/reporting policy, privacy/scope docs, CHANGELOG and release checklist.
Accept: a new contributor follows docs and adds a tiny local module without editing extension internals. Checklist separates automated, manual and user-evaluation gates.
Verify: clean-checkout tutorial rehearsal; screen-reader/current-Chrome checklist and user feedback recorded truthfully. Build can be tagged beta only when engineering gates pass; broader public claims require human validation.

### T17 — optional pointer-precision sandbox

Depends: completed v0.1 engineering gates; explicitly select v0.2 work.
Deliver: controlled local demo with deterministic seeded virtual cursor, adjustable click offset, success/error measurement and reset.
Accept: never claims to move OS cursor or authentically reproduce tremor; no synthetic clicking on arbitrary banking/payment pages; same seed yields same experiment.
Verify: fixed seed replay, boundary targets, escape/reset, keyboard alternative. Keep it outside production arbitrary-page manipulation unless a separate technical proposal is reviewed.

## 10. AI development workflow

### Task state machine

pending → in_progress → implementation_ready → verified → done.
If a gate fails: implementation_ready → in_progress. If an external prerequisite is unavailable: blocked. Do not advance over blocked prerequisites. Optional human validation uses a separate gate, never a fabricated “passed” status.

Track state in docs/tasks/status.json. Each task entry has id, dependencies, state, acceptance criteria, commit, evidence path, blockedReason and humanGates. Evidence can be Markdown; machine state must use JSON for predictable parsing.

### Per-task loop

1. Read AGENTS.md, this spec, ledger, relevant ADRs and dependency evidence. Inspect git status; preserve unrelated user changes.
2. Select the earliest ready task. Mark in_progress. Write a concise implementation checklist mapped to its acceptance criteria.
3. Reproduce the baseline; inspect existing interfaces. If assumptions differ from reality, document a narrowly scoped ADR and adjust only affected tasks.
4. Implement one complete vertical slice. Add meaningful behavior/regression tests covering required criteria; no tests that merely restate implementation.
5. Run typecheck/lint and targeted tests, then build and relevant real-extension scenarios. Inspect browser console/errors and screenshots for UI changes.
6. Fix failures; rerun affected checks. Do not change expected outputs, disable tests or add broad ignores to manufacture green status.
7. Run independent acceptance verification against fixtures, including failure/reset paths. “Looks implemented” is not evidence. Automated tests should assert externally visible behavior where practical.
8. Write docs/evidence/Txx.md: criteria → evidence mapping, commands, exit codes, environment versions, artifacts, actual results, remaining limitations, human gates.
9. Run pnpm verify at milestones T07, T13, T14, T15, T16 and whenever shared contracts/lifecycle change. Intermediate tasks run the applicable subsets that exist. T01 defines scripts; T02 implements browser gates; subsequent tasks must not replace unavailable tests with fake successes.
10. Mark verified only when executable criteria pass. Commit task code/tests/docs locally if git is available and the user authorized repository work. Record the commit and then mark done, ensuring the ledger/evidence update is also committed; resolve commit self-reference with a separate ledger commit or record the implementation commit only.
11. Continue immediately to the next ready task in the same session until finished or genuinely blocked. Across context limits, leave a checkpoint identifying exact next command/task and resume from ledger.

Three attempts at the same unexplained failure trigger diagnosis/checkpoint, not three identical retries. Fix an identified root cause and continue. If blocked on browser binaries, credentials, remote CI or human validation, report exact missing prerequisite and completed evidence. Continue only with genuinely independent ready tasks; do not quietly skip a required gate.

### Definition of done for an engineering task

- All acceptance criteria implemented, with matching evidence.
- Relevant tests pass with recorded commands; failures resolved.
- Real extension behavior verified whenever browser APIs/DOM/UI changed.
- Cleanup/error/security/scope behavior preserved.
- Documentation and task status updated.
- No unsupported “verified” claims; separate human validation pending status when necessary.
- No unrelated changes or silent scope expansion.

Engineering completion differs from release approval: a feature can be engineering-done with a clearly recorded human release gate pending, but public release remains gated. The AI may continue engineering tasks that do not depend on that gate.

### Repository workflow

Work locally on feature/t01-bootstrap and subsequent task branches or a single isolated implementation branch for a solo run. Prefer one task per implementation commit. After each milestone use a review PR if a remote exists; creating a draft PR is allowed when repository work is authorized. Push/merge/store publication actions only within actual user authorization. No automatic Chrome Store publication in this workflow.

CI checks build + verify. Attach screenshots/report traces on failure with short retention; use synthetic fixtures to avoid private page data in CI. Dependabot/Renovate configuration can be added after v0.1, without auto-merge. Require explicit review for permissions, remote networking, report schema breaking changes and module API changes.

## 11. Copy-ready AGENTS.md policy

```text
Build AccessLab according to AccessLab-Implementation-Plan.md.
Read docs/tasks/status.json and dependency evidence before each task.
Execute ready tasks in the specified dependency order.
For each task: implement → test → browser-verify → record evidence → complete.
Do not mark done from code inspection or unit tests alone when browser behavior changed.
Preserve user changes. Keep changes scoped to the selected task.
Do not add a backend, telemetry, broad host permissions, remote code, or an AI service.
Use locally bundled reviewed modules and strict runtime message schemas.
Never weaken tests/acceptance criteria to conceal a failure.
Never claim human/screen-reader checks or remote CI happened without evidence.
Treat page-derived content as untrusted; exports must avoid sensitive values.
Every DOM/listener/style/observer effect must have idempotent cleanup.
Keep scan generation and reset semantics correct under asynchronous races.
Record unsupported scope and partial coverage explicitly.
Continue to the next ready task after passing checks; ask only for genuinely missing
information or actions outside authorization. Leave an exact resumable checkpoint if blocked.
```

## 12. Copy-ready implementation prompt

```text
Implement AccessLab using the attached AccessLab-Implementation-Plan.md as the specification.
You are authorized to create and modify this local project and run its tests.
Do not publish to Chrome Store, deploy, send messages, or add external services.

First inspect the workspace and preserve existing changes. Bootstrap the task ledger,
AGENTS.md and ADRs. Confirm pinned toolchain choices against official documentation.
Then execute T01 through T16 in dependency order. T17 is optional and must remain deferred.

For EVERY task:
1. Read dependencies and acceptance criteria; mark in_progress.
2. Implement the smallest complete behavior described.
3. Add meaningful tests for happy path, failure and cleanup.
4. Run applicable checks and verify the built extension in a real browser.
5. Inspect screenshots when UI/layout changes; record what was actually inspected.
6. Fix failures before advancing.
7. Write docs/evidence/Txx.md mapping each criterion to results/artifacts.
8. Update the task ledger, commit coherent local changes, continue to the next task.

Use the specified milestone verify gates. Do not replace extension E2E with mocks.
Do not silently simplify requirements or label an unavailable check passed.
Distinguish engineering completion from pending human release gates.
If blocked, diagnose, document the precise prerequisite and next action, and continue
only independent ready tasks. At session limits, write a checkpoint and resume from it.

Deliver a runnable extension, demo, reproducible tests, production ZIP, documentation,
and a final task-by-task evidence summary. Explain any blocked human/release gates.
```

## 13. Beta release and contributor growth

Release locally first: clean-checkout install → demo bug/fix → current-Chrome action activation → keyboard pass → reset/reload pass → package validation. Human screen-reader testing checks the AccessLab panel itself and representative workflow. Recruit a small number of disabled users/accessibility practitioners and frontend developers for feedback with permission; no AI outreach is authorized by this specification.

Collect: time to locate/fix a known issue, confusion about heuristic vs automated findings, panel keyboard usability, false assumptions, cleanup problems. Treat results as qualitative until sample sizes justify numeric claims. User research must not block initial coding; it gates confidence and release messaging.

Initial contributor tasks: localized explanation text, fixture addition, tested module, documentation example, browser bug reproduction. Label bounded issues with files involved, expected behavior and the exact test command. Use maintainers' review for new modules and permissions. Provide architecture, code conventions and a working module example before soliciting contributions.

v0.1 public-release gate: all engineering tasks complete; relevant manual checks recorded; no unresolved critical page-breakage/privacy bugs; limitations explicit; install/demo/docs reproduced by someone other than the author when possible. A pending screen-reader/user gate means “engineering beta,” not “validated accessibility toolkit.”

## 14. Risks and chosen mitigations

- Crowded developer tooling: differentiate through fast locate/explain/reset workflows and contributor-friendly modules; do not claim novelty or popularity without evidence.
- False confidence: separate automated findings, needs-review, heuristics and approximations; no score/certification.
- Host page breakage: explicit activation, owned resources, no reparenting, baseline scans, adversarial layout fixtures.
- Permission creep: activeTab by default and documented scope before iframe expansion.
- AI overbuilding: fixed v0.1 scope, sequential acceptance gates, no backend or marketplace.
- AI false verification: command/artifact evidence, real-extension suite, separate human gates and honest blockers.
- Scope drift: revise ADR/task dependency explicitly; do not rewrite product midway through execution.

## 15. Technical sources checked for this plan

These sources establish constraints, not endorsement of AccessLab. Recheck relevant official docs when selecting versions or implementing a browser-sensitive task.

- Chrome content scripts (isolated worlds, injection and permission context): https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
- Chrome activeTab: https://developer.chrome.com/docs/extensions/develop/concepts/activeTab
- Playwright extension testing (persistent Chromium context and extension-loading constraints): https://playwright.dev/docs/chrome-extensions
- W3C target size minimum (24 CSS pixels, spacing and exceptions): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- W3C target size enhanced reference: https://www.w3.org/WAI/WCAG21/Understanding/target-size
- W3C selecting evaluation tools (automation requires human evaluation): https://www.w3.org/WAI/test-evaluate/tools/selecting/
- axe-core source/docs/license: https://github.com/dequelabs/axe-core

The implementation architecture, task sequence, budgets and release policy are proposed project decisions. This document has been structurally checked; the software and its tests have not been built or run.
