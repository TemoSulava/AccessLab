import { Effects, Generation, ModuleManager, OverlayLayer, cancellable } from '@accesslab/core';
import type { AuditReport, ScanState, Cleanup, TargetObservation, FocusObservation, BaselineEffect } from '@accesslab/contracts';
import { runAxe, AUDIT_TIMEOUT_MS, type AuditRunner, targetSize, focusTrail, visualPreview, type PreviewMode } from '@accesslab/modules';
export interface ControllerState { status: ScanState; revision: number; report?: AuditReport; message: string; dock: 'right'|'left'; collapsed: boolean; targetsActive:boolean; targetThreshold:24|44; observations:TargetObservation[]; targetCandidates:number; targetTruncated:number; hoveredTarget?:TargetObservation; focusActive:boolean; focusVisits:number; focusTrail:FocusObservation[]; previewMode?:PreviewMode; previewStrength:number; previewRegionLabel?:string; pickingRegion:boolean; }
export class PageController {
 readonly effects=new Effects();readonly scans=new Generation();readonly overlay:OverlayLayer;readonly manager:ModuleManager;
 readonly host:HTMLElement;readonly shadow:ShadowRoot;
 private ownedNodes=new WeakSet<Node>();private ownedAttributes=new WeakMap<Element,Set<string>>();private baselineEffects=new Set<BaselineEffect>();private previewGeneration=new Generation();private previewRegion?:Element;
 private auditAbort?:AbortController;private auditRunning=false;readonly targets=new Map<string,Element|null>();
 private listeners=new Set<()=>void>();private previous:Element|null;private url:string;private closed=false;private locateCleanup?:Cleanup;
 private snapshot:ControllerState={status:'idle',revision:0,message:'AccessLab is active',dock:'right',collapsed:false,targetsActive:false,targetThreshold:24,observations:[],targetCandidates:0,targetTruncated:0,focusActive:false,focusVisits:0,focusTrail:[],previewStrength:2,pickingRegion:false};
 onClose?:()=>void;
 constructor(readonly document:Document, private auditRunner:AuditRunner=runAxe, private auditTimeout=AUDIT_TIMEOUT_MS){
  this.previous=document.activeElement;this.url=document.location.href;
  this.host=document.createElement('div');this.host.dataset.accesslabRoot='';this.shadow=this.host.attachShadow({mode:'open'});document.documentElement.append(this.host);this.effects.add(()=>this.host.remove());
  this.overlay=new OverlayLayer(document,this.effects);
  this.manager=new ModuleManager({document,overlay:this.overlay,own:node=>this.ownedNodes.add(node),ownAttribute:(element,name)=>{const names=this.ownedAttributes.get(element)??new Set<string>();names.add(name);this.ownedAttributes.set(element,names);},baseline:{register:effect=>{this.baselineEffects.add(effect);return()=>{this.baselineEffects.delete(effect);}}},report:event=>{
   if(event.type==='preview-error'){this.update({previewMode:undefined,message:event.message});void this.manager.deactivate('visual-preview');}
   else if(event.type==='targets')this.update({observations:event.observations,targetCandidates:event.totalCandidates,targetTruncated:event.truncated});
   else if(event.type==='target-hover')this.update({hoveredTarget:event.observation});
   else if(event.type==='focus')this.update({focusVisits:event.visits,focusTrail:event.trail});
   else this.update({message:event.message});
  }});this.manager.register(targetSize);this.manager.register(focusTrail);this.manager.register(visualPreview);

  const observer=new MutationObserver(records=>{
   if(!this.host.isConnected){void this.close();return;}
   if(records.some(record=>!(record.type==='attributes'&&record.attributeName&&this.ownedAttributes.get(record.target as Element)?.has(record.attributeName))&&(!this.owned(record.target)&&[...record.addedNodes,...record.removedNodes].some(node=>!this.owned(node)) || (record.type!=='childList'&&!this.owned(record.target)))))this.invalidate('Page changed; run a new scan.');
  });observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,characterData:true});this.effects.add(()=>observer.disconnect());
  const navigation=()=>{if(document.location.href!==this.url){this.url=document.location.href;this.cancelScan();this.invalidate('Page URL changed; run a new scan.');}};
  const timer=setInterval(navigation,1000);this.effects.add(()=>clearInterval(timer));document.defaultView?.addEventListener('popstate',navigation);document.defaultView?.addEventListener('hashchange',navigation);this.effects.add(()=>{document.defaultView?.removeEventListener('popstate',navigation);document.defaultView?.removeEventListener('hashchange',navigation)});
 }
 owned(node:Node):boolean{let n:Node|null=node;while(n){if(this.ownedNodes.has(n)||n===this.host||n===this.overlay?.host)return true;n=n.parentNode??(n instanceof ShadowRoot?n.host:null);}return false;}
 getState=()=>this.snapshot;
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);}};
 update(change:Partial<ControllerState>){if(this.closed)return;this.snapshot={...this.snapshot,...change};for(const listener of this.listeners)listener();}
 invalidate(message:string){this.update({revision:this.snapshot.revision+1,...(this.snapshot.report?{status:'stale' as const,report:{...this.snapshot.report,stale:true}}:{}),message});}
 open(){this.update({collapsed:false});(this.shadow.querySelector('button') as HTMLElement|null)?.focus();}
 locate(element:Element|null,label='Located target'){void this.locateCleanup?.();if(!element?.isConnected){this.update({message:'Target unavailable: the element disappeared.'});return;}element.scrollIntoView({block:'center',behavior:'instant'});this.locateCleanup=this.overlay.show(element,label);this.update({message:label});}
 selectRegion(selector:string){if(selector.length>512){this.update({message:'Region selector is too long.'});return;}try{const element=this.document.querySelector(selector);if(!element||this.owned(element)){this.update({message:'Region unavailable. Enter a CSS selector for a host region.'});return;}this.previewRegion=element;this.update({previewRegionLabel:selector,message:'Preview region selected. Apply a rendering approximation explicitly.'});}catch{this.update({message:'Invalid CSS selector; no region selected.'});}}
 async applyPreview(mode:PreviewMode,strength=this.snapshot.previewStrength){if(this.auditRunning){this.update({message:'Wait for the audit to finish or cancel before applying a preview.'});return;}const element=this.previewRegion;if(!element?.isConnected){this.update({message:'Select a connected preview region first.'});return;}const generation=this.previewGeneration.next();this.baselineEffects.clear();this.update({previewMode:undefined,previewStrength:strength,message:'Applying selected region preview…'});try{await this.manager.activate('visual-preview',{element,mode,strength});if(this.previewGeneration.current(generation)&&this.manager.activeIds.includes('visual-preview'))this.update({previewMode:mode});}catch(error){if(this.previewGeneration.current(generation))this.update({previewMode:undefined,message:String(error)});}}
 async disablePreview(){this.previewGeneration.invalidate();this.baselineEffects.clear();await this.manager.deactivate('visual-preview');this.update({previewMode:undefined,message:'Visual preview disabled.'});}
 async enableFocus(){this.update({focusActive:true,focusVisits:0,focusTrail:[]});try{await this.manager.activate('focus-trail',{});}catch(error){this.update({focusActive:false,message:String(error)});}}
 async disableFocus(){await this.manager.deactivate('focus-trail');this.update({focusActive:false,focusVisits:0,focusTrail:[],message:'Observed focus trail disabled.'});}
 async clearFocus(){if(this.snapshot.focusActive)await this.enableFocus();else this.update({focusVisits:0,focusTrail:[]});}
 async enableTargets(threshold:24|44=this.snapshot.targetThreshold){this.update({targetsActive:true,targetThreshold:threshold,observations:[],message:'Measuring up to 1,000 targets…'});try{await this.manager.activate('target-size',{threshold});}catch(error){this.update({targetsActive:false,message:String(error)});}}
 async disableTargets(){await this.manager.deactivate('target-size');this.update({targetsActive:false,observations:[],hoveredTarget:undefined,targetCandidates:0,targetTruncated:0,message:'Target inspection disabled.'});}
 locateFinding(id:string){this.locate(this.targets.get(id)??null,'Located audit target.');}
 focusFinding(id:string){const target=this.targets.get(id);if(!target?.isConnected||!(target instanceof HTMLElement)){this.update({message:'Target unavailable: the element disappeared.'});return;}target.focus();this.update({message:this.document.activeElement===target||target.getRootNode() instanceof ShadowRoot?'Focus requested for target.':'Target could not receive focus; inspect its native focus behavior.'});}
 async runScan(){
  if(this.auditRunning)return;this.auditRunning=true;const generation=this.scans.next(),revision=this.snapshot.revision,abort=new AbortController();this.auditAbort=abort;this.targets.clear();this.overlay.suspend();const baseline=[...this.baselineEffects];this.update({status:'scanning',report:undefined,message:'Scanning top document…'});
  try{for(const effect of baseline)effect.suspend();const output=await cancellable(this.auditRunner(this.document,generation,revision),abort.signal,this.auditTimeout);if(!this.scans.current(generation)||this.closed)return;const stale=this.snapshot.revision!==revision;for(const [id,element] of output.targets)this.targets.set(id,element);this.update({status:stale?'stale':'complete',report:{...output.report,stale},message:stale?'Page changed during scan; results are stale.':`Scan complete: ${output.report.violations.length} automated findings; ${output.report.needsReview.length} need review.`});}
  catch(error){if(this.scans.current(generation)&&!this.closed)this.update({status:'error',message:String(error)});}
  finally{this.auditRunning=false;if(this.auditAbort===abort)this.auditAbort=undefined;this.overlay.resume();for(const effect of baseline)if(this.baselineEffects.has(effect))effect.resume();}
 }
 cancelScan(){this.scans.invalidate();this.auditAbort?.abort();if(this.snapshot.status==='scanning')this.update({status:'cancelled',message:'Scan cancelled. No new results published.'});}
 async reset(){this.cancelScan();this.baselineEffects.clear();this.previewGeneration.invalidate();this.previewRegion=undefined;this.targets.clear();await this.manager.reset().catch(e=>this.update({message:String(e)}));this.overlay.clear();this.update({status:'idle',report:undefined,previewMode:undefined,previewRegionLabel:undefined,pickingRegion:false,focusActive:false,focusVisits:0,focusTrail:[],targetsActive:false,observations:[],hoveredTarget:undefined,targetCandidates:0,targetTruncated:0,message:'Reset complete. No active effects.'});}
 async close(){if(this.closed)return;await this.reset();this.closed=true;await this.effects.dispose().catch(()=>{});this.listeners.clear();this.onClose?.();if(this.previous?.isConnected&&this.previous instanceof HTMLElement)this.previous.focus();}
}
