import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm', 'iife'],
  globalName: 'OmnipadJS',
  clean: true,
  dts: true,
  minify: true,
  sourcemap: false,
  noExternal: ['@omnipad/core'],
  outDir: 'dist',
});
