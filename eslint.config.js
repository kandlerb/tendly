const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const reactNativePlugin = require('eslint-plugin-react-native');

module.exports = [
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-native': reactNativePlugin,
    },
    rules: {
      // Disallow hardcoded hex color values (Rule 34 – token enforcement)
      'react-native/no-color-literals': 'error',

      // Disallow inline styles — encourages StyleSheet usage
      'react-native/no-inline-styles': 'warn',

      // TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.expo/**',
      'supabase/**',
      'babel.config.js',
      'tailwind.config.js',
      'eslint.config.js',
      '.eslintrc.json',
    ],
  },
];
