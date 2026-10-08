import { REPORT_BYTES, reportSchema, type AuditReport, type Finding, type TargetObservation, type FocusObservation } from '@accesslab/contracts';
export interface ExportObservations { targets:TargetObservation[]; focus:FocusObservation[]; omittedTargetCandidates:number; }
// Only application-owned report fields cross the boundary; DOM objects are never serialized.
export function exportData(report:AuditReport, observations?:ExportObservations) {
 const audit=reportSchema.parse(structuredClone(report));const url=new URL(audit.page);if(!['http:','https:'].includes(url.protocol))throw new Error('Unsupported report URL');audit.page=url.origin+url.pathname;
 const data={schemaVersion:1 as const,audit,...(observations?{observations:{targets:observations.targets.map(t=>({id:t.id,target:t.target,width:t.width,height:t.height,threshold:t.threshold,small:t.small})),focus:observations.focus.map(f=>({index:f.index,target:f.target,elementType:f.elementType})),omittedTargetCandidates:observations.omittedTargetCandidates}}:{})};
 budget(JSON.stringify(data));return data;
}
function budget(text:string){if(new TextEncoder().encode(text).length>REPORT_BYTES)throw new Error('Export exceeds 5 MiB; no partial export created. Reduce inspected scope and run again.');return text;}
// Encode markup and punctuation, including newlines, so page text cannot create HTML, links or headings.
export function markdownText(value:string){return value.replace(/[^a-zA-Z0-9 ,.:/\-]/g,c=>`&#${c.codePointAt(0)};`);}
export function serializeReport(report:AuditReport,format:'json'|'markdown',observations?:ExportObservations){
 const data=exportData(report,observations);if(format==='json')return budget(JSON.stringify(data,null,2));
 const a=data.audit;const esc=markdownText;
 const finding=(f:Finding)=>`- ${esc(f.ruleId)} (${esc(f.impact??'unrated')}, ${esc(f.id)}): ${esc(f.help)}\n  - Target: ${esc(f.target.join(' → '))}\n  - ${esc(f.explanation)} ${esc(f.suggestion)}\n  - Guidance: ${esc(f.helpUrl)}`;
 const lines=['# AccessLab report',`Schema: 1 · Product: ${esc(a.productVersion)} · Engine: ${esc(a.engine.name)} ${esc(a.engine.version)}`,`Page: ${esc(a.page)}`,`Started: ${esc(a.startedAt)} · Duration: ${a.durationMs} ms · Viewport: ${a.viewport.width} × ${a.viewport.height}`,`Stale: ${a.stale} · Generation: ${a.generation} · Page revision: ${a.pageRevision}`,`Top document only; excluded frames: ${a.scope.excludedFrames}`, ...a.scope.limits.map(l=>`- ${esc(l)}`),'','## Automated violations',...a.violations.map(finding),'','## Needs manual review',...a.needsReview.map(finding)];
 if(data.observations)lines.push('','## Inspection observations (heuristics, separate from violations)',`Omitted target candidates: ${data.observations.omittedTargetCandidates}`,...data.observations.targets.map(t=>`- Target ${esc(t.target)}: ${t.width} × ${t.height} CSS px; threshold ${t.threshold}; small: ${t.small}`),...data.observations.focus.map(f=>`- Focus ${f.index}: ${esc(f.target)} (${esc(f.elementType)})`));
 return budget(lines.join('\n\n')+'\n');
}
