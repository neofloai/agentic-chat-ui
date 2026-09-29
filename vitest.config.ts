import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const src = (p: string) => fileURLToPath(new URL(`./src/${p}`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@neofloai\/agentic-chat$/, replacement: src('index.ts') },
      { find: /^@neofloai\/agentic-chat\/headless$/, replacement: src('headless.ts') },
      { find: /^@neofloai\/agentic-chat\/core$/, replacement: src('core.ts') },
      { find: /^@neofloai\/agentic-chat\/charts$/, replacement: src('charts.ts') },
      { find: /^@neofloai\/agentic-chat\/mock$/, replacement: src('mock.ts') },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['test/**/*.test.{ts,tsx}'],
    setupFiles: ['test/setup.ts'],
    restoreMocks: true,
    // Atoms imports its self-hosted font CSS; let Vite handle it instead of Node.
    server: { deps: { inline: [/@neofloai\/atoms/, /@fontsource/] } },
    coverage: {
      provider: 'v8',
      include: ['src/core/**'],
      thresholds: { lines: 90, functions: 90, statements: 90, branches: 80 },
    },
  },
});
