import type { Cleanup, OverlayService } from '@accesslab/contracts';
import { Effects } from './index';
export class OverlayLayer implements OverlayService {
 readonly host: HTMLElement;
 private entries = new Map<HTMLElement,Element>();
 private frame = 0;
 constructor(private document: Document, effects: Effects) {
  this.host=document.createElement('div');this.host.dataset.accesslabOverlay='';
  const shadow=this.host.attachShadow({mode:'open'});const style=document.createElement('style');
  style.textContent=':host{all:initial!important;position:fixed!important;inset:0!important;z-index:2147483646!important;pointer-events:none!important}:host([hidden]){display:none!important}.outline{position:fixed;box-sizing:border-box;border:3px solid #bc3300;background:transparent;color:#fff;font:14px/1.5 system-ui;pointer-events:none}.label{position:absolute;bottom:100%;left:0;background:#7a2000;padding:1px 5px;max-width:240px;white-space:nowrap}';shadow.append(style);document.documentElement.append(this.host);effects.add(()=>this.host.remove());
  const schedule=()=>this.schedule();document.addEventListener('scroll',schedule,true);document.defaultView?.addEventListener('resize',schedule);effects.add(()=>{document.removeEventListener('scroll',schedule,true);document.defaultView?.removeEventListener('resize',schedule);cancelAnimationFrame(this.frame);this.clear()});
 }
 get count(){return this.entries.size;}
 show(element: Element,label=''):Cleanup {
  if(!element.isConnected || this.entries.size>=200)return()=>{};
  const box=this.document.createElement('div');box.className='outline';
  if(label){const tag=this.document.createElement('span');tag.className='label';tag.textContent=label;box.append(tag);}
  this.host.shadowRoot!.append(box);this.entries.set(box,element);this.update();
  let removed=false;return()=>{if(removed)return;removed=true;this.entries.delete(box);box.remove();};
 }
 clear(){for(const box of this.entries.keys())box.remove();this.entries.clear();}
 suspend(){this.host.hidden=true;}
 resume(){this.host.hidden=false;this.schedule();}
 private schedule(){if(this.frame)return;this.frame=requestAnimationFrame(()=>{this.frame=0;this.update()});}
 private update(){for(const [box,element] of this.entries){if(!element.isConnected){this.entries.delete(box);box.remove();continue;}const r=element.getBoundingClientRect();Object.assign(box.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});}}
}
