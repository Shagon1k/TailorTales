import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from '@eslint-react/eslint-plugin';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
    // Global ignores
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.next/**',
            '**/coverage/**',
            '**/generated/**',
        ],
    },

    // Base JS rules for all files
    eslint.configs.recommended,

    // TypeScript rules for all TS/TSX files
    {
        files: ['**/*.{ts,tsx}'],
        extends: [tseslint.configs.recommended],
        rules: {
            'no-duplicate-imports': 'error',
            // Soft guard against god-files — a signal to decompose, not a hard block (warn).
            // Counts code lines only; generated code is excluded above.
            'max-lines': ['warn', { max: 500, skipBlankLines: true, skipComments: true }],
        },
    },

    // Backend — Node.js environment, type-aware rules (enabled after tsconfig is in place)
    {
        files: ['backend/**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },

    // Frontend — browser environment + React rules
    {
        files: ['frontend/**/*.{ts,tsx}'],
        ...reactPlugin.configs['recommended-typescript'],
        languageOptions: {
            ...reactPlugin.configs['recommended-typescript'].languageOptions,
            globals: {
                ...globals.browser,
            },
        },
        plugins: {
            ...reactPlugin.configs['recommended-typescript'].plugins,
            'react-hooks': reactHooksPlugin,
        },
        rules: {
            ...reactPlugin.configs['recommended-typescript'].rules,
            ...reactHooksPlugin.configs.recommended.rules,
        },
    },

    // Disable ESLint rules that conflict with Prettier (always last)
    prettier,
);
