import { Effects, Generation, ModuleManager, OverlayLayer } from '@accesslab/core';
import type { AuditReport, ScanState, Cleanup } from '@accesslab/contracts';
export interface ControllerState { status: ScanState; revision: number; report?: AuditReport; message: string; dock: 'right'|'left'; collapsed: boolean; }
export class PageController {
 readonly effects=new Effects();readonly scans=new Generation();readonly overlay:OverlayLayer;readonly manager:ModuleManager;
 readonly host:HTMLElement;readonly shadow:ShadowRoot;
 private listeners=new Set<()=>void>();private previous:Element|null;private url:string;private closed=false;private locateCleanup?:Cleanup;
 private snapshot:ControllerState={status:'idle',revision:0,message:'AccessLab is active',dock:'right',collapsed:false};
 onClose?:()=>void;
 constructor(readonly document:Document){
  this.previous=document.activeElement;this.url=document.location.href;
  this.host=document.createElement('div');this.host.dataset.accesslabRoot='';this.shadow=this.host.attachShadow({mode:'open'});document.documentElement.append(this.host);this.effects.add(()=>this.host.remove());
  this.overlay=new OverlayLayer(document,this.effects);
  this.manager=new ModuleManager({document,overlay:this.overlay,report:event=>this.update({message:event.type==='status'?event.message:`Observed ${event.visits} focus visits`})});
  const observer=new MutationObserver(records=>{
   if(!this.host.isConnected){void this.close();return;}
   if(records.some(record=>!this.owned(record.target)&&[...record.addedNodes,...record.removedNodes].some(node=>!this.owned(node)) || (record.type!=='childList'&&!this.owned(record.target))))this.invalidate('Page changed; run a new scan.');
  });observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,characterData:true});this.effects.add(()=>observer.disconnect());
  const navigation=()=>{if(document.location.href!==this.url){this.url=document.location.href;this.scans.invalidate();this.invalidate('Page URL changed; run a new scan.');}};
  const timer=setInterval(navigation,1000);this.effects.add(()=>clearInterval(timer));document.defaultView?.addEventListener('popstate',navigation);document.defaultView?.addEventListener('hashchange',navigation);this.effects.add(()=>{document.defaultView?.removeEventListener('popstate',navigation);document.defaultView?.removeEventListener('hashchange',navigation)});
 }
 owned(node:Node):boolean{let n:Node|null=node;while(n){if(n===this.host||n===this.overlay?.host)return true;n=n.parentNode??(n instanceof ShadowRoot?n.host:null);}return false;}
 getState=()=>this.snapshot;
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);}};
 update(change:Partial<ControllerState>){if(this.closed)return;this.snapshot={...this.snapshot,...change};for(const listener of this.listeners)listener();}
 invalidate(message:string){this.update({revision:this.snapshot.revision+1,...(this.snapshot.report?{status:'stale' as const,report:{...this.snapshot.report,stale:true}}:{}),message});}
 open(){this.update({collapsed:false});(this.shadow.querySelector('button') as HTMLElement|null)?.focus();}
 locate(element:Element|null,label='Located target'){void this.locateCleanup?.();if(!element?.isConnected){this.update({message:'Target unavailable: the element disappeared.'});return;}element.scrollIntoView({block:'center',behavior:'instant'});this.locateCleanup=this.overlay.show(element,label);this.update({message:label});}
 async reset(){this.scans.invalidate();await this.manager.reset().catch(e=>this.update({message:String(e)}));this.overlay.clear();this.update({status:'idle',report:undefined,message:'Reset complete. No active effects.'});}
 async close(){if(this.closed)return;await this.reset();this.closed=true;await this.effects.dispose().catch(()=>{});this.listeners.clear();this.onClose?.();if(this.previous?.isConnected&&this.previous instanceof HTMLElement)this.previous.focus();}
}
