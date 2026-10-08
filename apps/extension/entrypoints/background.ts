import { defineBackground } from 'wxt/utils/define-background';
import { browser } from 'wxt/browser';
import { supportedPage } from '../src/runtime/pages';
import { ackSchema, withTimeout } from '@accesslab/contracts';
declare const __ACCESSLAB_TEST__: boolean;
export default defineBackground(() => {
  async function activate(tabId: number, url: string) {
    if (!supportedPage(url)) throw new Error('This page is restricted. Open an ordinary http(s) webpage.');
    await browser.scripting.executeScript({ target: { tabId, frameIds: [0] }, files: ['/content-scripts/content.js'] });
    const requestId = crypto.randomUUID();
    const ack = ackSchema.parse(await withTimeout(browser.tabs.sendMessage(tabId, { schemaVersion: 1, requestId, type: 'activate', payload: {} }, { frameId: 0 }), 5000));
    if (ack.requestId !== requestId || !ack.payload.active) throw new Error('Activation was not acknowledged');
    return true;
  }
  browser.action.onClicked.addListener(async tab => {
    if (!tab.id) return;
    try { await activate(tab.id, tab.url ?? ''); await browser.action.setBadgeText({ tabId: tab.id, text: '' }); await browser.action.setTitle({tabId:tab.id,title:'Open AccessLab'}); }
    catch { await browser.action.setBadgeText({ tabId: tab.id, text: '!' }); await browser.action.setTitle({ tabId: tab.id, title: 'AccessLab cannot open here. Use an ordinary http(s) page and try again.' }); }
  });
  if (__ACCESSLAB_TEST__) {
    Object.assign(globalThis, { __accesslabTestActivate: async (tabId: number) => {
      const tab = await browser.tabs.get(tabId);
      if (!tab.url?.startsWith('http://127.0.0.1:4173/')) throw new Error('Test activation is restricted to the local fixture server.');
      return activate(tabId, tab.url);
    } });
  }
});
