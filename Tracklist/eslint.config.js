import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  // Ignore specific directories or files
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.{js,jsx}'], // Target JavaScript and JSX files
    languageOptions: {
      ecmaVersion: 'latest', // Use the latest ECMAScript version
      globals: {
        ...globals.browser, // Include browser globals
        process: true, // Include Node.js globals like `process`
        module: true,
        require: true,
        exports: true,
      },
      parserOptions: {
        ecmaVersion: 2020, // ECMAScript 2020 syntax
        ecmaFeatures: { jsx: true }, // Enable JSX parsing
        sourceType: 'module', // Use ES Module syntax
      },
      
    },
    settings: { react: { version: 'detect' } }, // Automatically detect React version
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules, // Include JavaScript recommended rules
      ...react.configs.recommended.rules, // Include React recommended rules
      ...react.configs['jsx-runtime'].rules, // Include React JSX runtime rules
      ...reactHooks.configs.recommended.rules, // Include React Hooks recommended rules

      // Custom rules
      'react/jsx-no-target-blank': 'off', // Allow links without noreferrer
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'no-console': 'warn', // Warn about `console` usage
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }], // Ignore unused variables starting with `_`
    },
  },
];

