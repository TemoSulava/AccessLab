import { defineContentScript } from 'wxt/utils/define-content-script';
import { browser } from 'wxt/browser';
import { parseCommand, trustedSender } from '@accesslab/contracts';
import { PageController } from '../src/runtime/controller';
const local=globalThis as typeof globalThis & { __accesslabController?: PageController };
export default defineContentScript({ registration: 'runtime', main() {
 if(local.__accesslabController){local.__accesslabController.open();return;}
 const controller=new PageController(document);local.__accesslabController=controller;controller.onClose=()=>{delete local.__accesslabController;};
 const style=document.createElement('style');style.textContent=':host{all:initial!important;position:fixed!important;right:12px!important;top:12px!important;z-index:2147483647!important;background:#fff!important;color:#17202a!important;padding:16px!important;border:2px solid #1f3550!important;font:16px/1.5 system-ui!important}button{font:inherit}';controller.shadow.append(style);
 const label=document.createElement('p');controller.shadow.append(label);
 const render=()=>{label.textContent=controller.getState().message;};controller.effects.add(controller.subscribe(render));render();
 const close=document.createElement('button');close.textContent='Close AccessLab';close.addEventListener('click',()=>{void controller.close()});controller.shadow.append(close);
 const listener:Parameters<typeof browser.runtime.onMessage.addListener>[0]=(value,sender)=>{
  if(!trustedSender(sender,browser.runtime.id))return;const command=parseCommand(value);if(!command)return;
  if(command.type==='activate')controller.open();
  return Promise.resolve({schemaVersion:1,requestId:command.requestId,type:'ack',payload:{active:controller.host.isConnected,state:controller.getState().status}});
 };
 browser.runtime.onMessage.addListener(listener);controller.effects.add(()=>browser.runtime.onMessage.removeListener(listener));
} });
