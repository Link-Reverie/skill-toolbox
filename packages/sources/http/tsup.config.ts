import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Disable DTS due to workspace dependency resolution
  clean: true,
  sourcemap: true,
  external: ['@skill-toolbox/utils'],
});
