import { defineContentScript } from 'wxt/utils/define-content-script';
import { browser } from 'wxt/browser';
import { parseCommand, trustedSender } from '@accesslab/contracts';
export default defineContentScript({ registration: 'runtime', main() {
  if (document.querySelector('[data-accesslab-root]')) return;
  const host = document.createElement('div'); host.dataset.accesslabRoot = '';
  host.attachShadow({ mode: 'open' }).innerHTML = '<p>AccessLab is active</p>';
  document.documentElement.append(host);
  browser.runtime.onMessage.addListener((value, sender) => {
    if (!trustedSender(sender, browser.runtime.id)) return;
    const command = parseCommand(value); if (!command) return;
    return Promise.resolve({schemaVersion: 1, requestId: command.requestId, type: 'ack', payload: {active: host.isConnected, state: 'idle'}});
  });
} });
