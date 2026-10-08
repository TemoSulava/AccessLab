import { defineContentScript } from 'wxt/utils/define-content-script';
import { browser } from 'wxt/browser';
import { parseCommand, trustedSender } from '@accesslab/contracts';
import { mountPanel } from '../src/panel/mount';
import { defaultPreferences, preferencesSchema } from '@accesslab/contracts';
import { PageController } from '../src/runtime/controller';
const local=globalThis as typeof globalThis & { __accesslabController?: PageController };
export default defineContentScript({ registration: 'runtime', main() {
 if(local.__accesslabController){local.__accesslabController.open();return;}
 const controller=new PageController(document);local.__accesslabController=controller;controller.onClose=()=>{delete local.__accesslabController;};
 mountPanel(controller,browser.runtime.getURL('/docs.html'));
 void browser.storage.local.get('preferences').then(saved=>{try{const prefs=preferencesSchema.parse(saved.preferences);controller.update({dock:prefs.dock});}catch{/* invalid/old preferences use defaults */}});
 let dock=controller.getState().dock;
 controller.effects.add(controller.subscribe(()=>{const next=controller.getState().dock;if(next===dock)return;dock=next;void browser.storage.local.set({preferences:{...defaultPreferences,dock}});}));
 const listener:Parameters<typeof browser.runtime.onMessage.addListener>[0]=(value,sender)=>{
  if(!trustedSender(sender,browser.runtime.id))return;const command=parseCommand(value);if(!command)return;
  if(command.type==='activate')controller.open();
  return Promise.resolve({schemaVersion:1,requestId:command.requestId,type:'ack',payload:{active:controller.host.isConnected,state:controller.getState().status}});
 };
 browser.runtime.onMessage.addListener(listener);controller.effects.add(()=>browser.runtime.onMessage.removeListener(listener));
} });
