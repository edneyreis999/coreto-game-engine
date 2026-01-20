import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  eslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'src/**/*.tsx', 'packages/*/src/**/*.ts', 'packages/*/src/**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: [
          './tsconfig.json',
          './packages/*/tsconfig.json',
          './packages/*/tsconfig.node.json',
          './packages/*/tsconfig.web.json',
        ],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        // Node.js globals (for main/preload processes)
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        NodeJS: 'readonly',
        // Browser globals (for renderer process)
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Disable base no-unused-vars in favor of TypeScript version
      'no-unused-vars': 'off',
      // TypeScript-specific rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/strict-boolean-expressions': 'off',

      // General rules
      'no-console': 'off', // CLI tool needs console output
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', '*.config.js'],
  },
];
