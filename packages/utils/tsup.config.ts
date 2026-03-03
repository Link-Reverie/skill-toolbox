import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  // Mark fs-extra as external so it's loaded at runtime, not bundled
  external: ['fs-extra'],
  platform: 'node',
  target: 'node18',
});
