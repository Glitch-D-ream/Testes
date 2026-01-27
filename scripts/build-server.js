import * as esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolverPlugin = {
  name: 'resolver-plugin',
  setup(build) {
    build.onResolve({ filter: /\.js$/ }, args => {
      if (args.importer) {
        const baseName = args.path.replace(/\.js$/, '');
        const tsPath = path.resolve(path.dirname(args.importer), baseName + '.ts');
        
        if (fs.existsSync(tsPath)) {
          return { path: tsPath };
        }
      }
      return undefined;
    });
  },
};

async function runBuild() {
  try {
    await esbuild.build({
      entryPoints: ['server/index.ts'],
      bundle: true,
      platform: 'node',
      format: 'esm',
      outfile: 'dist/index.js',
      plugins: [resolverPlugin],
      // Banner corrigido para evitar SyntaxError de declaração duplicada
      banner: {
        js: `
import { createRequire as __createRequire } from 'module';
import { fileURLToPath as __fileURLToPath } from 'url';
import { dirname as __dirnameFunc } from 'path';
globalThis.require = __createRequire(import.meta.url);
globalThis.__filename = __fileURLToPath(import.meta.url);
globalThis.__dirname = __dirnameFunc(globalThis.__filename);
const require = globalThis.require;
const __filename = globalThis.__filename;
const __dirname = globalThis.__dirname;
`,
      },
      external: [
        'express', 'jsonwebtoken', 'bcryptjs', 'winston', 'dotenv', 
        '@supabase/supabase-js', 'nanoid', 'express-rate-limit', 
        'cookie-parser', 'telegraf', 'jspdf', 'jspdf-autotable', 
        'node-html-to-image', 'axios', 'zod', 'tsx', 'prom-client', '@sentry/node',
        'cheerio', 'puppeteer-core', 'playwright', 'playwright-core'
      ],
    });
    console.log('Server build completed successfully!');

    const distPublicPath = path.resolve('dist/public');
    if (!fs.existsSync(distPublicPath)) {
      fs.mkdirSync(distPublicPath, { recursive: true });
    }

    const clientDistPath = path.resolve('client/dist');
    if (fs.existsSync(clientDistPath)) {
      copyRecursiveSync(clientDistPath, distPublicPath);
      console.log('Frontend files copied to dist/public successfully!');
    }
  } catch (error) {
    console.error('Server build failed:', error);
    process.exit(1);
  }
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest);
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

runBuild();
