import type { AccessLabModule, BaselineEffect } from '@accesslab/contracts';
import { object,exact } from '@accesslab/contracts';
import { ownedElement } from '../dom';
export type PreviewMode='grayscale'|'blur';
export interface PreviewConfig {element:Element;mode:PreviewMode;strength:number;}
export function unsafeRegion(element:Element):string|null {
 if(!element.isConnected||ownedElement(element)||['HTML','BODY'].includes(element.tagName))return 'Select a connected region outside AccessLab; html/body are unsupported.';
 if((element as HTMLElement).style?.getPropertyPriority('filter')==='important')return 'An inline important host filter prevents a safe preview.';
 const roots:(Element|ShadowRoot)[]=[element];let count=0;
 while(roots.length){const root=roots.pop()!;const elements=root instanceof Element?[root,...root.querySelectorAll('*')]:[...root.querySelectorAll('*')];for(const node of elements){if(++count>500)return 'Region exceeds the 500-element preview budget.';if(['fixed','sticky','absolute'].includes(getComputedStyle(node).position))return 'Positioned descendants/layout are unsupported. Select a smaller static region.';if(node.tagName.includes('-')&&!node.shadowRoot)return 'Unavailable custom-element internals cannot be safely previewed.';if(node.shadowRoot)roots.push(node.shadowRoot);}}
 return null;
}
export const visualPreview:AccessLabModule<PreviewConfig>={id:'visual-preview',apiVersion:1,kind:'preview',exclusiveGroup:'visual-preview',capabilities:['region-filter','baseline-suspension'],configSchema:{parse(value){const v=object(value);exact(v,['element','mode','strength']);if(!(v.element instanceof Element)||!['grayscale','blur'].includes(String(v.mode))||typeof v.strength!=='number'||!Number.isFinite(v.strength)||v.strength<0||v.strength>8)throw Error('Invalid preview configuration');return v as unknown as PreviewConfig;}},async activate(ctx,config){
 const reason=unsafeRegion(config.element);if(reason)throw Error('Preview unsupported: '+reason);
 const id='accesslab-'+crypto.randomUUID(),attribute='data-'+id;ctx.ownAttribute?.(config.element,attribute);config.element.setAttribute(attribute,id);ctx.effects.add(()=>{if(config.element.getAttribute(attribute)===id)config.element.removeAttribute(attribute);});
 const style=ctx.document.createElement('style');style.dataset.accesslabPreviewStyle='';ctx.own?.(style);ctx.document.head.append(style);ctx.effects.add(()=>style.remove());
 let suspended=false,frame=0;const rendering=config.mode==='grayscale'?'grayscale(1)':`blur(${config.strength}px)`;
 function refresh(){if(!style.sheet)return;style.sheet.disabled=true;const existing=getComputedStyle(config.element).filter;style.textContent=`[${attribute}="${id}"]{filter:${existing==='none'?'':existing} ${rendering}!important}`;if(style.sheet)style.sheet.disabled=suspended;}
 refresh();if(!getComputedStyle(config.element).filter.includes(config.mode)){throw Error('Preview unsupported: the host stylesheet or policy prevented filtering.');}
 const baseline:BaselineEffect={suspend(){suspended=true;if(style.sheet)style.sheet.disabled=true;},resume(){suspended=false;refresh();}};
 if(!ctx.baseline)throw Error('Missing baseline suspension service');ctx.effects.add(ctx.baseline.register(baseline));
 const changed=(records:MutationRecord[])=>{if(records.every(record=>record.target===style||style.contains(record.target)||(record.type==='attributes'&&record.attributeName===attribute)||(record.target instanceof Element&&ownedElement(record.target))))return;if(frame||ctx.signal.aborted)return;frame=requestAnimationFrame(()=>{frame=0;const reason=unsafeRegion(config.element);if(reason){ctx.report({type:'preview-error',message:'Preview disabled: '+reason});return;}refresh();});};
 const observer=new MutationObserver(changed);observer.observe(ctx.document.documentElement,{subtree:true,childList:true,attributes:true});ctx.effects.add(()=>{observer.disconnect();cancelAnimationFrame(frame);});ctx.report({type:'status',message:`${config.mode==='grayscale'?'Grayscale':'Blur'} region approximation active. Baseline scans temporarily suspend it.`});return()=>{};
}};
