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
      external: [
        'express', 'jsonwebtoken', 'bcryptjs', 'winston', 'dotenv', 
        '@supabase/supabase-js', 'nanoid', 'express-rate-limit', 
        'cookie-parser', 'telegraf', 'groq-sdk', 'openai', 
        '@google/generative-ai', 'jspdf', 'jspdf-autotable', 
        'node-html-to-image', 'axios', 'zod', 'tsx'
      ],
    });
    console.log('Server build completed successfully!');
  } catch (error) {
    console.error('Server build failed:', error);
    process.exit(1);
  }
}

runBuild();
