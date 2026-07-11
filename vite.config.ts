import { defineConfig } from 'vitest/config';

export default defineConfig({
  // relative base so the build works on GitHub Pages project sites
  base: './',
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
