import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'dist-playground', 'coverage', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['**/*.{js,mjs}'], languageOptions: { globals: { ...globals.node } } },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      '@typescript-eslint/no-empty-object-type': 'off',
      // Atoms is the only design system: never reach into MUI or Emotion directly.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@mui/*', '@emotion/*'], message: 'Import from @neofloai/atoms (or /icons, /tokens, /theme) instead.' },
            { group: ['@neofloai/atoms/dist/*'], message: 'Atoms build internals are not a public API.' },
          ],
        },
      ],
    },
  },
  {
    files: ['test/**'],
    rules: { 'require-yield': 'off' },
  },
  {
    // The headless layer must stay free of Atoms so teams can bring their own design.
    files: [
      'src/core/**',
      'src/react/**',
      'src/registry/**',
      'src/blocks/**',
      'src/mock/**',
      'src/headless.ts',
      'src/core.ts',
      'src/mock.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@neofloai/atoms', '@neofloai/atoms/*', '@mui/*', '@emotion/*', 'recharts'],
              message: 'The headless layer must not depend on Atoms or Recharts.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/core/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react-dom', '@neofloai/atoms', '@neofloai/atoms/*'], message: 'core is framework-free.' },
          ],
        },
      ],
    },
  },
);
