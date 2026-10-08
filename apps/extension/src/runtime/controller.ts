import { Effects, Generation, ModuleManager, OverlayLayer, cancellable } from '@accesslab/core';
import type { AuditReport, ScanState, Cleanup } from '@accesslab/contracts';
import { runAxe, AUDIT_TIMEOUT_MS, type AuditRunner } from '@accesslab/modules';
export interface ControllerState { status: ScanState; revision: number; report?: AuditReport; message: string; dock: 'right'|'left'; collapsed: boolean; }
export class PageController {
 readonly effects=new Effects();readonly scans=new Generation();readonly overlay:OverlayLayer;readonly manager:ModuleManager;
 readonly host:HTMLElement;readonly shadow:ShadowRoot;
 private auditAbort?:AbortController;private auditRunning=false;readonly targets=new Map<string,Element|null>();
 private listeners=new Set<()=>void>();private previous:Element|null;private url:string;private closed=false;private locateCleanup?:Cleanup;
 private snapshot:ControllerState={status:'idle',revision:0,message:'AccessLab is active',dock:'right',collapsed:false};
 onClose?:()=>void;
 constructor(readonly document:Document, private auditRunner:AuditRunner=runAxe, private auditTimeout=AUDIT_TIMEOUT_MS){
  this.previous=document.activeElement;this.url=document.location.href;
  this.host=document.createElement('div');this.host.dataset.accesslabRoot='';this.shadow=this.host.attachShadow({mode:'open'});document.documentElement.append(this.host);this.effects.add(()=>this.host.remove());
  this.overlay=new OverlayLayer(document,this.effects);
  this.manager=new ModuleManager({document,overlay:this.overlay,report:event=>this.update({message:event.type==='status'?event.message:`Observed ${event.visits} focus visits`})});
  const observer=new MutationObserver(records=>{
   if(!this.host.isConnected){void this.close();return;}
   if(records.some(record=>!this.owned(record.target)&&[...record.addedNodes,...record.removedNodes].some(node=>!this.owned(node)) || (record.type!=='childList'&&!this.owned(record.target))))this.invalidate('Page changed; run a new scan.');
  });observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,characterData:true});this.effects.add(()=>observer.disconnect());
  const navigation=()=>{if(document.location.href!==this.url){this.url=document.location.href;this.cancelScan();this.invalidate('Page URL changed; run a new scan.');}};
  const timer=setInterval(navigation,1000);this.effects.add(()=>clearInterval(timer));document.defaultView?.addEventListener('popstate',navigation);document.defaultView?.addEventListener('hashchange',navigation);this.effects.add(()=>{document.defaultView?.removeEventListener('popstate',navigation);document.defaultView?.removeEventListener('hashchange',navigation)});
 }
 owned(node:Node):boolean{let n:Node|null=node;while(n){if(n===this.host||n===this.overlay?.host)return true;n=n.parentNode??(n instanceof ShadowRoot?n.host:null);}return false;}
 getState=()=>this.snapshot;
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);}};
 update(change:Partial<ControllerState>){if(this.closed)return;this.snapshot={...this.snapshot,...change};for(const listener of this.listeners)listener();}
 invalidate(message:string){this.update({revision:this.snapshot.revision+1,...(this.snapshot.report?{status:'stale' as const,report:{...this.snapshot.report,stale:true}}:{}),message});}
 open(){this.update({collapsed:false});(this.shadow.querySelector('button') as HTMLElement|null)?.focus();}
 locate(element:Element|null,label='Located target'){void this.locateCleanup?.();if(!element?.isConnected){this.update({message:'Target unavailable: the element disappeared.'});return;}element.scrollIntoView({block:'center',behavior:'instant'});this.locateCleanup=this.overlay.show(element,label);this.update({message:label});}
 locateFinding(id:string){this.locate(this.targets.get(id)??null,'Located audit target.');}
 focusFinding(id:string){const target=this.targets.get(id);if(!target?.isConnected||!(target instanceof HTMLElement)){this.update({message:'Target unavailable: the element disappeared.'});return;}target.focus();this.update({message:this.document.activeElement===target||target.getRootNode() instanceof ShadowRoot?'Focus requested for target.':'Target could not receive focus; inspect its native focus behavior.'});}
 async runScan(){
  if(this.auditRunning)return;this.auditRunning=true;const generation=this.scans.next(),revision=this.snapshot.revision,abort=new AbortController();this.auditAbort=abort;this.targets.clear();this.overlay.suspend();this.update({status:'scanning',report:undefined,message:'Scanning top document…'});
  try{const output=await cancellable(this.auditRunner(this.document,generation,revision),abort.signal,this.auditTimeout);if(!this.scans.current(generation)||this.closed)return;const stale=this.snapshot.revision!==revision;for(const [id,element] of output.targets)this.targets.set(id,element);this.update({status:stale?'stale':'complete',report:{...output.report,stale},message:stale?'Page changed during scan; results are stale.':`Scan complete: ${output.report.violations.length} automated findings; ${output.report.needsReview.length} need review.`});}
  catch(error){if(this.scans.current(generation)&&!this.closed)this.update({status:'error',message:String(error)});}
  finally{this.auditRunning=false;if(this.auditAbort===abort)this.auditAbort=undefined;this.overlay.resume();}
 }
 cancelScan(){this.scans.invalidate();this.auditAbort?.abort();if(this.snapshot.status==='scanning')this.update({status:'cancelled',message:'Scan cancelled. No new results published.'});}
 async reset(){this.cancelScan();this.targets.clear();await this.manager.reset().catch(e=>this.update({message:String(e)}));this.overlay.clear();this.update({status:'idle',report:undefined,message:'Reset complete. No active effects.'});}
 async close(){if(this.closed)return;await this.reset();this.closed=true;await this.effects.dispose().catch(()=>{});this.listeners.clear();this.onClose?.();if(this.previous?.isConnected&&this.previous instanceof HTMLElement)this.previous.focus();}
}
