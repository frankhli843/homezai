import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'dist-ssr',
    // Written by scripts/build-content.mjs, so linting it would only ever report on
    // the generator's output formatting.
    'src/generated',
    // Vendored at build time out of node_modules.
    'public/admin/sveltia-cms.js',
    'public/admin/revisions.js',
    // Built from src/admin by vite.admin.config.js. The source is linted; the bundle
    // is minified output and reporting on it says nothing about this repository's code.
    'public/admin/preview.js',
  ]),
  {
    // Build scripts and tests run in Node, not in a browser.
    files: ['scripts/**/*.{js,mjs}', 'test/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
