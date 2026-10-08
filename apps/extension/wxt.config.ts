import { defineConfig } from 'wxt';
export default defineConfig({ manifest: { name: 'AccessLab', description: 'Find accessibility barriers. Inspect the cause. Verify the fix.', permissions: ['activeTab', 'scripting', 'storage'], action: { default_title: 'Open AccessLab' } } });
