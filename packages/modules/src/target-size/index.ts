import type { AccessLabModule, TargetObservation, Cleanup } from '@accesslab/contracts';
import { object, exact } from '@accesslab/contracts';
import { candidates, INTERACTIVE, elementPath, ownedElement, visibleTarget } from '../dom';
export const TARGET_CANDIDATE_CAP=1000;
export function smallTarget(width:number,height:number,threshold:24|44){return width<threshold||height<threshold;}
export function measure(element:Element,threshold:24|44,id:string):TargetObservation|null {if(!visibleTarget(element))return null;const r=element.getBoundingClientRect();return{id,target:elementPath(element),width:Math.round(r.width*100)/100,height:Math.round(r.height*100)/100,threshold,small:smallTarget(r.width,r.height,threshold)};}
export const targetSize:AccessLabModule<{threshold:24|44}>={id:'target-size',apiVersion:1,kind:'inspection',capabilities:['layout-measurement','pointer-observation'],configSchema:{parse(value){const v=object(value);exact(v,['threshold']);if(v.threshold!==24&&v.threshold!==44)throw Error('Invalid target threshold');return{threshold:v.threshold};}},async activate(ctx,config){
 const all=candidates(ctx.document),observations:TargetObservation[]=[];let outlines=0;
 for(let i=0;i<Math.min(all.length,TARGET_CANDIDATE_CAP);i++){if(ctx.signal.aborted)return()=>{};const observation=measure(all[i],config.threshold,String(i));if(observation){observations.push(observation);if(observation.small&&outlines<199){ctx.effects.add(ctx.overlay.show(all[i],`${observation.width}×${observation.height} · inspect`));outlines++;}}if(i%40===39)await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));}
 if(ctx.signal.aborted)return()=>{};ctx.report({type:'targets',observations,totalCandidates:all.length,truncated:Math.max(0,all.length-TARGET_CANDIDATE_CAP)});ctx.report({type:'status',message:`Measured ${observations.length} visible targets. Small targets are heuristic observations.`});
 let frame=0,last:Element|null=null,hoverCleanup:Cleanup|undefined;
 const pointer=(event:PointerEvent)=>{last=event.composedPath().find((n):n is Element=>n instanceof Element&&!ownedElement(n)&&n.matches(INTERACTIVE))??null;if(frame)return;frame=requestAnimationFrame(()=>{frame=0;void hoverCleanup?.();if(!last||ctx.signal.aborted)return;const observation=measure(last,config.threshold,'hover');if(observation){hoverCleanup=ctx.effects.add(ctx.overlay.show(last,`${observation.width}×${observation.height} CSS px`));ctx.report({type:'target-hover',observation});}});};
 ctx.document.addEventListener('pointermove',pointer,true);ctx.effects.add(()=>{ctx.document.removeEventListener('pointermove',pointer,true);cancelAnimationFrame(frame);});return()=>{};
}};
