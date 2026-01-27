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

// Polyfills para ambiente Node.js puro (necessários para bibliotecas como pdf-parse/pdfjs)
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor(init) {
      this.m11 = 1; this.m12 = 0; this.m13 = 0; this.m14 = 0;
      this.m21 = 0; this.m22 = 1; this.m23 = 0; this.m24 = 0;
      this.m31 = 0; this.m32 = 0; this.m33 = 1; this.m34 = 0;
      this.m41 = 0; this.m42 = 0; this.m43 = 0; this.m44 = 1;
      if (Array.isArray(init) || (init && init.buffer instanceof ArrayBuffer)) {
        this.m11 = init[0]; this.m12 = init[1]; this.m21 = init[2]; this.m22 = init[3];
        this.m41 = init[4]; this.m42 = init[5];
      }
    }
    translate(x = 0, y = 0, z = 0) { return this; }
    scale(x = 1, y = undefined, z = 1, originX = 0, originY = 0, originZ = 0) { return this; }
    rotate(angle = 0, originX = 0, originY = 0) { return this; }
    multiply(other) { return this; }
    preMultiplySelf(other) { return this; }
    invertSelf() { return this; }
    multiplySelf(other) { return this; }
  };
}
if (typeof globalThis.ImageData === 'undefined') {
  globalThis.ImageData = class ImageData {
    constructor(width, height) {
      this.width = width; this.height = height;
      this.data = new Uint8ClampedArray(width * height * 4);
    }
  };
}
if (typeof globalThis.Path2D === 'undefined') {
  globalThis.Path2D = class Path2D {
    constructor() {}
    addPath() {} closePath() {} moveTo() {} lineTo() {}
    bezierCurveTo() {} quadraticCurveTo() {} arc() {} arcTo() {}
    ellipse() {} rect() {}
  };
}
`,
      },
      external: [
        'express', 'jsonwebtoken', 'bcryptjs', 'winston', 'dotenv', 
        '@supabase/supabase-js', 'nanoid', 'express-rate-limit', 
        'cookie-parser', 'telegraf', 
        'axios', 'zod', 'tsx', 'prom-client', '@sentry/node',
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
