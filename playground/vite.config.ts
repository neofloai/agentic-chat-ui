import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const src = (p: string) => here(`../src/${p}`);
const pkg = JSON.parse(readFileSync(here('../package.json'), 'utf8')) as { version: string };

// PAGES=1 builds the public GitHub Pages demo: mock data only, real-backend code compiled out.
const pages = process.env.PAGES === '1';

export default defineConfig(({ mode }) => ({
  root: here('.'),
  base: process.env.PAGES_BASE ?? '/',
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@neofloai\/agentic-chat$/, replacement: src('index.ts') },
      { find: /^@neofloai\/agentic-chat\/headless$/, replacement: src('headless.ts') },
      { find: /^@neofloai\/agentic-chat\/core$/, replacement: src('core.ts') },
      { find: /^@neofloai\/agentic-chat\/charts$/, replacement: src('charts.ts') },
      { find: /^@neofloai\/agentic-chat\/mock$/, replacement: src('mock.ts') },
    ],
  },
  define: {
    __PAGES__: JSON.stringify(pages),
    __VERSION__: JSON.stringify(pkg.version),
    __COMMIT__: JSON.stringify((process.env.GITHUB_SHA ?? 'local').slice(0, 7)),
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
    // Never let backend settings into the public bundle.
    ...(pages ? { 'import.meta.env.VITE_CHAT_BASE_URL': 'undefined', 'import.meta.env.VITE_CHAT_TOKEN': 'undefined' } : {}),
  },
  build: {
    outDir: here('../dist-playground'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
  },
  server: { port: 5173 },
}));
