import { licenseInventory } from './license-inventory';
import { defineConfig } from 'wxt';
export default defineConfig({
  outDir: process.env.ACCESSLAB_TEST === '1' ? '.output-test' : '.output',
  vite: () => ({ plugins:[licenseInventory()],define: { __ACCESSLAB_TEST__: JSON.stringify(process.env.ACCESSLAB_TEST === '1') } }),
  manifest: { name: 'AccessLab', description: 'Find accessibility barriers. Inspect the cause. Verify the fix.', permissions: ['activeTab', 'scripting', 'storage'], ...(process.env.ACCESSLAB_TEST === '1' ? { host_permissions: ['http://127.0.0.1/*'] } : {}), action: { default_title: 'Open AccessLab' } },
});
