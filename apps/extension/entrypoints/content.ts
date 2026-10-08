import { defineContentScript } from 'wxt/utils/define-content-script';
import { browser } from 'wxt/browser';
import { parseCommand, trustedSender } from '@accesslab/contracts';
import { Effects } from '@accesslab/core';
export default defineContentScript({ registration: 'runtime', main() {
  if (document.querySelector('[data-accesslab-root]')) return;
  const effects = new Effects();
  const host = document.createElement('div'); host.dataset.accesslabRoot = '';
  const shadow = host.attachShadow({ mode: 'open' });
  const label = document.createElement('p'); label.textContent = 'AccessLab is active'; shadow.append(label);
  const close = document.createElement('button'); close.textContent = 'Close AccessLab'; shadow.append(close);
  document.documentElement.append(host); effects.add(() => { host.remove(); });
  const dispose = () => { void effects.dispose(); }; close.addEventListener('click',dispose); effects.add(() => close.removeEventListener('click',dispose));
  const listener: Parameters<typeof browser.runtime.onMessage.addListener>[0] = (value, sender) => {
    if (!trustedSender(sender, browser.runtime.id)) return;
    const command = parseCommand(value); if (!command) return;
    return Promise.resolve({schemaVersion: 1, requestId: command.requestId, type: 'ack', payload: {active: host.isConnected, state: 'idle'}});
  };
  browser.runtime.onMessage.addListener(listener); effects.add(() => browser.runtime.onMessage.removeListener(listener));
} });
