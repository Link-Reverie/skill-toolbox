import esbuild from 'esbuild';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'dist/index.js',
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
  external: [
    // 这些包有原生依赖，不打包
    'fsevents',
  ],
  minify: false,
  sourcemap: false,
  treeShaking: true,
  metafile: true,
  logLevel: 'info',
}).then(() => {
  console.log('✅ Build completed successfully!');
}).catch((error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});