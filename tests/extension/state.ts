import type { Worker } from '@playwright/test';
import type { ControllerState } from '../../apps/extension/src/runtime/controller';
export async function readState(worker:Worker,url:string):Promise<ControllerState>{return worker.evaluate(async url=>{
 const api=globalThis as unknown as {chrome:{tabs:{query:(x:object)=>Promise<{id:number;url?:string}[]>};scripting:{executeScript:(x:object)=>Promise<{result:ControllerState}[]>}}};const tab=(await api.chrome.tabs.query({})).find(t=>t.url===url)!;
 const results=await api.chrome.scripting.executeScript({target:{tabId:tab.id,frameIds:[0]},func:()=>{const local=globalThis as unknown as {__accesslabController:{getState:()=>ControllerState}};return local.__accesslabController.getState();}});return results[0].result;
},url);}
