import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    headless: 'src/headless.ts',
    core: 'src/core.ts',
    charts: 'src/charts.ts',
    mock: 'src/mock.ts',
    conformance: 'src/conformance.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  // esbuild already tree-shakes the bundle. tsup's extra Rollup pass would strip the
  // "use client" banner below, so it stays off.
  treeshake: false,
  target: 'es2022',
  // Every entry can reach React code through shared chunks, so the directive goes on all of
  // them. It keeps Next.js App Router consumers from having to wrap the library themselves.
  banner: { js: '"use client";' },
  onSuccess: 'node scripts/fix-directives.mjs',
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    '@neofloai/atoms',
    '@neofloai/atoms/icons',
    '@neofloai/atoms/tokens',
    '@neofloai/atoms/theme',
    'recharts',
    'react-markdown',
    'remark-gfm',
    '@radix-ui/react-slot',
  ],
});
