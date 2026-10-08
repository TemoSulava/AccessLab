import { defineContentScript } from 'wxt/utils/define-content-script';
export default defineContentScript({ registration: 'runtime', main() {
  if (document.querySelector('[data-accesslab-root]')) return;
  const host = document.createElement('div'); host.dataset.accesslabRoot = '';
  host.attachShadow({ mode: 'open' }).innerHTML = '<p>AccessLab is active</p>';
  document.documentElement.append(host);
} });
