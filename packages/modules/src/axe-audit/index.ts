import axe from 'axe-core';
import { INTERACTIVE,ownedElement } from '../dom';
import { explainRule } from './explanations';
import type { AuditReport, Finding, Impact } from '@accesslab/contracts';
export const AUDIT_TAGS=['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'];
export const AUDIT_TIMEOUT_MS=30000;
export const SCOPE_LIMITS=['Top document only; iframe elements excluded.','Closed shadow roots are inaccessible; they cannot be comprehensively counted.','Automated checks cover only part of accessibility; manual checks remain.'];
export interface AuditOutput { report:AuditReport; targets:Map<string,Element|null>; }
export type AuditRunner=(document:Document,generation:number,revision:number)=>Promise<AuditOutput>;
export function safePageUrl(href:string){const url=new URL(href);return url.origin+url.pathname;}
export function findingId(rule:string,target:string[],duplicate:number){let hash=2166136261;for(const char of JSON.stringify([rule,target,duplicate]))hash=Math.imul(hash^char.charCodeAt(0),16777619);return `${rule}-${(hash>>>0).toString(16)}-${duplicate}`;}
export function resolveTarget(document:Document,target:string[]):Element|null {
 let root:Document|ShadowRoot=document;let element:Element|null=null;
 try{for(let i=0;i<target.length;i++){element=root.querySelector(target[i]);if(!element)return null;if(i<target.length-1){if(!element.shadowRoot)return null;root=element.shadowRoot;}}return element;}catch{return null;}
}
export function normalize(document:Document,results:axe.AxeResults,generation:number,revision:number,startedAt:string,durationMs:number):AuditOutput {
 const targets=new Map<string,Element|null>(),duplicates=new Map<string,number>();
 function findings(rules:axe.Result[],reviewStatus:Finding['reviewStatus']):Finding[]{return rules.flatMap(rule=>rule.nodes.map(node=>{
  const target=node.target.flat(Infinity).map(String);const key=JSON.stringify([rule.id,target]);const duplicate=duplicates.get(key)??0;duplicates.set(key,duplicate+1);const id=findingId(rule.id,target,duplicate);const element=resolveTarget(document,target);targets.set(id,element);
  return {id,ruleId:rule.id,impact:(rule.impact??null) as Impact,description:rule.description,help:rule.help,helpUrl:rule.helpUrl,tags:rule.tags,reviewStatus,target,elementType:element?.tagName.toLowerCase()??'unavailable',...explainRule(rule.id,rule.description)};
 }));}
 return {targets,report:{schemaVersion:1,productVersion:'0.1.0',engine:{name:'axe-core',version:axe.version,tags:AUDIT_TAGS},page:safePageUrl(document.location.href),viewport:{width:document.defaultView!.innerWidth,height:document.defaultView!.innerHeight},startedAt,durationMs,generation,pageRevision:revision,stale:false,scope:{topDocument:true,excludedFrames:document.querySelectorAll('iframe').length,limits:SCOPE_LIMITS},violations:findings(results.violations,'violation'),needsReview:findings(results.incomplete,'needs-review')}};
}
const busy=new WeakSet<Document>();
export const runAxe:AuditRunner=async(document,generation,revision)=>{
 const roots:(Element|ShadowRoot)[]=[document.documentElement];let elements=0,interactive=0;
 while(roots.length){const root=roots.pop()!;const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT,{acceptNode:node=>ownedElement(node as Element)|| (node as Element).hasAttribute('data-accesslab-color-resource')|| (node as Element).hasAttribute('data-accesslab-preview-style')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
 const count=(element:Element)=>{elements++;if(element.matches(INTERACTIVE))interactive++;if(element.shadowRoot)roots.push(element.shadowRoot);if(elements>5000||interactive>1000)throw new Error('AUDIT_SCOPE_TOO_LARGE: this page exceeds the safe v0.1 budget (5,000 elements / 1,000 interactive targets, including open shadow roots). Audit was not run. Use a smaller developer-owned fixture; manual checks remain.');};
 if(root instanceof Element)count(root);let node:Node|null;while((node=walker.nextNode()))count(node as Element);
 }
 if(busy.has(document))throw new Error('Previous audit is still finishing. Retry shortly.');busy.add(document);const start=performance.now();const startedAt=new Date().toISOString();
 try{const results=await axe.run({include:[document.documentElement],exclude:[['[data-accesslab-root]'],['[data-accesslab-overlay]'],['iframe'],['[data-accesslab-color-resource]'],['[data-accesslab-preview-style]']]},{runOnly:{type:'tag',values:AUDIT_TAGS},iframes:false,resultTypes:['violations','incomplete']});return normalize(document,results,generation,revision,startedAt,performance.now()-start);}
 finally{busy.delete(document);}
};
