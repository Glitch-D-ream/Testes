import * as esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';

const resolverPlugin = {
  name: 'resolver-plugin',
  setup(build) {
    // Intercepta importações que terminam em .js
    build.onResolve({ filter: /\.js$/ }, args => {
      if (args.importer) {
        // Remove a extensão .js e tenta encontrar o arquivo .ts correspondente
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
      banner: {
        js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
      },
      external: [
        'express', 'jsonwebtoken', 'bcryptjs', 'winston', 'dotenv', 
        '@supabase/supabase-js', 'nanoid', 'express-rate-limit', 
        'cookie-parser', 'telegraf', 'jspdf', 'jspdf-autotable', 
        'node-html-to-image', 'axios', 'zod', 'tsx', 'prom-client', '@sentry/node',
        'cheerio', 'puppeteer-core'
      ],
    });
    console.log('Server build completed successfully!');

    // Copiar frontend para dist/public
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
