import { it,expect } from 'vitest';
import { supportedPage } from '../../apps/extension/src/runtime/pages';
it('restricts privileged/store pages by parsed origin and permits ordinary http(s)',()=>{for(const url of ['chrome://settings','about:blank','file:///private','https://chromewebstore.google.com/detail/id','https://chrome.google.com/webstore/detail/id','bad','javascript:alert(1)'])expect(supportedPage(url)).toBe(false);for(const url of ['http://localhost:4173/','https://example.test/','https://chromewebstore.google.com.example.test/'])expect(supportedPage(url)).toBe(true);});
