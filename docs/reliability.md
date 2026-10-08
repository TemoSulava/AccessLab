# Reliability and supported scope

The lifecycle matrix is exercised by loaded-extension tests and pure lifecycle/adapter tests:

| Scenario | Evidence suite |
|---|---|
| Activate twice; 20 Close/reinject cycles | smoke.spec.ts |
| 20 target/focus/color/reset cycles, resources return to baseline | reliability.spec.ts |
| Reset during scan; no late results; Cancel generation | audit.spec.ts; audit.test.ts |
| Close active effects; reopen baseline | reliability.spec.ts; panel.spec.ts |
| Reload baseline; SPA changes; two independent tabs | controller.spec.ts |
| Removed/replaced target never retargets wrong element | findings.spec.ts; controller.spec.ts |
| Worker stop/restart; existing panel still acknowledges state | reliability.spec.ts |
| Preview suspended during audit; Reset never restores it | previews.spec.ts |
| Audit failure/timeout and successful retry | audit.test.ts |
| Throwing cleanup does not prevent other cleanup | lifecycle.test.ts |
| Unsupported URL; parsed origin matching | pages.test.ts; production manual action checklist |
| Malformed/oversized messages | contracts.test.ts; smoke.spec.ts |
| Open-shadow mutation stales report; oversized shadow audit rejected | audit.spec.ts |
| Five activation samples on 10k-node fixture | reliability.spec.ts; performance.json |

Budgets: audit preflight ≤5,000 elements and ≤1,000 interactive elements including discoverable open shadow roots; 30-second async audit timeout; target inspection measures first 1,000 candidates in animation-frame batches, discloses omitted candidates, renders ≤200 overlays; focus history ≤100; findings display pages of 50; normalized reports validate schema/5 MiB before panel publication; exports ≤5 MiB and refuse oversized outputs without dropping findings. Region previews ≤500 elements, one exclusive mode, reject root/positioned/unknown custom-element scope. Ten-thousand-control activation and target inspection are supported; auditing that entire fixture is explicitly refused because the engine's synchronous startup can block the page (ADR 004).

Mutation tracking observes the document and discovered open shadow roots, ignores owned effects, and releases disconnected roots. Native modal top-layer content may cover the injected panel; close the host modal to return to controls. Closed shadow internals, frames, browser UI/store pages, inaccessible custom controls and assistive-technology behavior are outside automated coverage. CSS scaling is tested; actual Chrome zoom and screen-reader workflows require human validation.

Idle inspection does not repeatedly scan the document. Target scan runs on enable/config changes; focus uses actual focusin events; scroll/resize overlays use requestAnimationFrame. DOM effects, subscriptions, listeners, observers, animation frames, timers and Blob URLs have owned cleanup. Reset stops modules and discards reports; Close additionally removes panel/overlays/listeners and restores connected prior focus. Same-tab reload returns to baseline without automatic activation. Toolchain hot reload/uninstall can leave injected resources until a hard reload; use hard reload as recovery.

Performance samples are environment-specific development measurements, not promises for all hardware. Browser/system metadata and raw five samples are retained in docs/performance.json after the recorded run. Heap diagnostics and human evaluation are not inferred from passing resource-count assertions.
