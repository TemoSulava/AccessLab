import tseslint from 'typescript-eslint';
export default tseslint.config({ ignores: ['**/.output/**', '**/.output-test/**', '**/.wxt/**', '**/node_modules/**', 'artifacts/**', 'dist/**', 'test-results/**', 'playwright-report/**'] }, ...tseslint.configs.recommended, { rules: { '@typescript-eslint/no-explicit-any': 'error', '@typescript-eslint/no-empty-object-type': 'off' } });
