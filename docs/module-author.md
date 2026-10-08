# Author a locally bundled module

Use the existing isolated checkout and README prerequisites; no worktree, remote loader or new dependency is needed. The shipped registry imports trusted code at build time. This tutorial adds a bounded light-document heading overlay inspector and optional native Inspect control. It makes no WCAG verdict, exports no page text, and never changes focus or host inline styles.

1. Copy `templates/module.ts.template` to `packages/modules/src/heading-outline.ts`.
2. In `packages/modules/src/registry.ts`, import `headingOutline` from `./heading-outline`. Add this entry to `moduleRegistry`:

```ts
{module:headingOutline,control:{
 label:'Heading outlines',
 description:'Bounded light-document heading overlays for manual review.',
 defaultConfig:{limit:3},
}},
```

3. Copy `templates/module.test.ts.template` to `tests/unit/heading-outline.test.ts` and `templates/module.spec.ts.template` to `tests/extension/heading-outline.spec.ts`.
4. Run `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, `pnpm build`, and `pnpm test:extension`. The new browser test loads the actual extension, chooses Inspect → Enable Heading outlines, verifies three owned overlays, and resets/closes them. The unit test rejects invalid limits and checks 20 cycles. Run `pnpm verify` before proposing shared changes.
5. Load the production build locally, activate on the demo, choose Inspect → Enable Heading outlines. Reset removes outlines and returns the control to Enable. No file under apps/extension needs editing; generic registration/control rendering already supports local entries. Remove your registry entry and example files if this is only a rehearsal.

The template uses `AccessLabModule<Config>` from contracts: stable unique id, apiVersion 1, audit/inspection/preview kind, strict runtime config schema, declared capabilities, optional exclusive group, and async activate returning idempotent cleanup. ModuleManager parses unknown config before activation; do not coerce unsupported fields. Default control config must pass the schema. Registry controls are optional, explicitly enabled, and suitable for simple known local defaults; complex configurable UI requires a separate reviewed design.

Use `ctx.effects.add(cleanup)` for every listener, observer, timer, frame, node, attribute and overlay. Returned cleanup is also owned. Observe `ctx.signal.aborted` around asynchronous work and rely on guarded `ctx.report` for current-instance events; never publish through an unguarded global callback. Add replacement/reset/partial-failure/late-response tests where relevant. Cleanup errors must not prevent other resources disposing.

`ctx.overlay.show(element,label)` returns cleanup and uses a separate owned layer. For other inserted nodes, call `ctx.own(node)` before insertion and register removal. For attributes, register the cleanup returned by `ctx.ownAttribute(element,name)` before changing it, then register conditional attribute removal/restoration; ownership markers release after observer delivery. Never overwrite host inline styles or unconditionally undo concurrent host changes. Rendering effects must register `ctx.baseline.register({suspend,resume})` with owned cleanup so audits measure baseline and Reset cannot resurrect effects. Core overlay cap is 200; keep your own discovery/rendering bounded.

Treat page strings as data; use text content and strict schemas. Do not read values, cookies, credentials or whole HTML into reports. Do not add permissions, dynamic imports from remote URLs, telemetry, synthetic host clicking or arbitrary-page input interception. Document excluded frames/shadows and distinguish heuristic observations/manual review from engine violations. New API/export/permission or arbitrary-page manipulation needs a reviewed proposal and full verification.
