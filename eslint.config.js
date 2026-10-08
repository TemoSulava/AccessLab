import tseslint from 'typescript-eslint';
export default tseslint.config({ ignores: ['**/.output/**', '**/.wxt/**', '**/node_modules/**', 'artifacts/**', 'dist/**', 'test-results/**', 'playwright-report/**'] }, ...tseslint.configs.recommended, { rules: { '@typescript-eslint/no-explicit-any': 'error' } });
