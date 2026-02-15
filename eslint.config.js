import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  eslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'src/**/*.tsx', 'packages/*/src/**/*.ts', 'packages/*/src/**/*.tsx', 'packages/*/src/assets/**/*.ts'],
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
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        BufferEncoding: 'readonly',
        // Test globals (for Jest)
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        // Browser globals (for renderer process)
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        React: 'readonly',
        Electron: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Disable base no-unused-vars in favor of TypeScript version
      'no-unused-vars': 'off',
      // Disable no-undef for TypeScript - TS compiler handles this
      'no-undef': 'off',
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
    ignores: [
      'dist/',
      'dist/**',
      'packages/*/dist/',
      'packages/*/dist/**',
      'out/',
      'out/**',
      'packages/*/out/',
      'packages/*/out/**',
      'node_modules/',
      'node_modules/**',
      'coverage/',
      'coverage/**',
      '*.config.js',
      '**/*.config.js',
      '**/tailwind.config.js',
      'docs/',
      'docs/**',
      'temp/',
      'temp/**',
    ],
  },
];
