# AccessLab

A local Chrome extension to find accessibility barriers, inspect their cause and verify a fix. Version 0.1 is an engineering beta; automated findings and rendering approximations do not establish accessibility compliance. Human screen-reader, current stable Chrome and participant evaluation gates remain open.

## Quick start

Use Node 24.19.0, pnpm 11.19.0 and Python 3 for packaging. Clone this repository, then run:

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm build
pnpm dev:demo
```

On Linux without browser libraries, use `pnpm exec playwright install --with-deps chromium`. Before adding/updating a dependency, follow [dependency security checks](docs/decisions/003-dependency-security.md). Keep verification enabled and use the committed lockfile.

In your local Chrome, open chrome://extensions, enable Developer mode, choose **Load unpacked**, and select `apps/extension/.output/chrome-mv3`. Pin AccessLab to the toolbar. Open the demo at `http://127.0.0.1:4173/` and click the toolbar action. Cloud onboarding does not provide a localhost web preview; use the automated loaded-extension tests in the cloud, or run the demo locally for this manual walkthrough. AccessLab activates only on your request.

1. Choose **Run audit**. Review missing labels/names/alternative text and contrast findings; use **Locate target**, then separately **Focus target** if needed.
2. Check **Use fixed examples**, then run the audit again. The paired name/label/image barriers should disappear; other/manual findings may remain.
3. In **Inspect**, enable observed focus trail and use Tab/Shift+Tab on the host page. Inspect target-size measurements at 24 or 44 CSS pixels; these are heuristics with spacing/exceptions.
4. In **Preview**, enter `#preview-region`, select the region and explicitly apply a grayscale, blur or color-vision approximation. Audits temporarily suspend it to measure baseline.
5. Open **Export report**, preview JSON or Markdown, then explicitly download. Review locators/pathnames before sharing. **Reset** clears reports/effects; **Close** removes the panel and restores connected prior focus.

Panel tabs support arrows/Home/End; native controls support keyboard activation. Escape inside the panel closes it. Host-page keys are not intercepted. Native host dialogs may cover the panel; close the host modal before returning to the panel. Only preferences persist.

## Checks and package

```sh
pnpm verify
pnpm package
```

Verification runs lint, types, unit/component tests, production build, loaded-extension browser tests and visual gates. The test build has a localhost-only worker hook and separate .output-test directory; never distribute it. ZIP and SHA-256 files are written to dist/. See [packaging](docs/packaging.md) and the [release checklist](docs/release-checklist.md).

## Scope and contribution

Top document and discoverable open shadow roots; no iframe/closed-shadow coverage. Audit budget is 5,000 elements / 1,000 interactive targets; oversized documents fail explicitly before the engine can block the page. Previews require a static region ≤500 elements. Rendering approximations do not reproduce lived experience. No accounts, backend, telemetry, remote scans or all-site permission.

Read [privacy/scope](docs/privacy-and-scope.md), [architecture](docs/architecture.md), [module tutorial](docs/module-author.md), [test guide](docs/testing.md), [contribution guide](CONTRIBUTING.md), [security policy](SECURITY.md) and [task evidence](docs/tasks/status.json). Optional v0.2 pointer sandbox requires explicit selection and is outside this v0.1 build.

MIT project license; third-party terms preserved in [notices](THIRD_PARTY_NOTICES.md) and production artifacts.
