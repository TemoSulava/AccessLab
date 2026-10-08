import type { AccessLabModule, Cleanup, FocusObservation } from '@accesslab/contracts';
import { object, exact } from '@accesslab/contracts';
import { elementPath, ownedElement } from '../dom';
export const FOCUS_HISTORY_CAP=100;
export const focusTrail:AccessLabModule<Record<string,never>>={id:'focus-trail',apiVersion:1,kind:'inspection',capabilities:['focus-observation'],configSchema:{parse(value){const v=object(value);exact(v,[]);return{};}},async activate(ctx){
 let sequence=0,current:Cleanup|undefined;let entries:{element:Element;observation:FocusObservation;cleanup:Cleanup}[]=[];const roots=new Set<ShadowRoot>();
 const publish=()=>ctx.report({type:'focus',visits:sequence,trail:entries.map(e=>e.observation)});
 const prune=()=>{const removed=entries.filter(e=>!e.element.isConnected);if(!removed.length)return;for(const e of removed)void e.cleanup();entries=entries.filter(e=>e.element.isConnected);publish();};
 const observer=new MutationObserver(prune);observer.observe(ctx.document.documentElement,{subtree:true,childList:true});ctx.effects.add(()=>observer.disconnect());
 const focus=(event:FocusEvent)=>{
  const element=event.composedPath().find((n):n is Element=>n instanceof Element);if(!element||ownedElement(element)||ctx.signal.aborted)return;prune();void current?.();
  const root=element.getRootNode();if(root instanceof ShadowRoot&&!roots.has(root)&&roots.size<100){roots.add(root);observer.observe(root,{subtree:true,childList:true});}
  const observation:FocusObservation={index:++sequence,target:elementPath(element),elementType:element.tagName.toLowerCase()};const cleanup=ctx.effects.add(ctx.overlay.show(element,String(sequence)));entries.push({element,observation,cleanup});if(entries.length>FOCUS_HISTORY_CAP)void entries.shift()!.cleanup();current=ctx.effects.add(ctx.overlay.show(element,`Current focus · ${sequence}`));publish();
 };
 ctx.document.addEventListener('focusin',focus,true);ctx.effects.add(()=>ctx.document.removeEventListener('focusin',focus,true));ctx.report({type:'focus',visits:0,trail:[]});ctx.report({type:'status',message:'Observed focus trail enabled. Navigate the page normally.'});return()=>{};
}};
