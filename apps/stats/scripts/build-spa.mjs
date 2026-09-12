#!/usr/bin/env node
/** Bundle the trainer as a single-page app (no server): spa-dist/index.html + app.js. */
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(app, 'src');
const out = path.join(app, process.env.SPA_OUT ?? 'spa-dist');
fs.mkdirSync(out, { recursive: true });

const spaAliases = {
  'next/link': path.join(src, 'spa/shims/link.tsx'),
  'next/navigation': path.join(src, 'spa/shims/navigation.ts'),
};

const plugin = {
  name: 'spa-aliases',
  setup(b) {
    b.onResolve({ filter: /^next\// }, (args) => (spaAliases[args.path] ? { path: spaAliases[args.path] } : undefined));
    b.onResolve({ filter: /^@\// }, (args) => b.resolve(path.join(src, args.path.slice(2)), { resolveDir: args.resolveDir, kind: args.kind }));
    // server-only modules → browser equivalents
    b.onResolve({ filter: /(^|\/)content$/ }, (args) => {
      if (args.path === './content' && args.resolveDir.replace(/\\/g, '/').endsWith('/lib/server')) return { path: path.join(src, 'spa/content.ts') };
      if (/\/lib\/server\/content$/.test(args.path)) return { path: path.join(src, 'spa/content.ts') };
      return undefined;
    });
    b.onResolve({ filter: /(^|\/)storage$/ }, (args) => {
      if (args.path === './storage' && args.resolveDir.replace(/\\/g, '/').endsWith('/lib/server')) return { path: path.join(src, 'spa/storage.ts') };
      if (/\/lib\/server\/storage$/.test(args.path)) return { path: path.join(src, 'spa/storage.ts') };
      return undefined;
    });
  },
};

const result = await build({
  entryPoints: [path.join(src, 'spa/main.tsx')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.json': 'json' },
  outfile: path.join(out, 'app.js'),
  plugins: [plugin],
  logLevel: 'warning',
  metafile: true,
});

// Tailwind utilities actually used by the components, generated at build time (no CDN at runtime).
let tailwind = '';
try {
  const postcss = (await import('postcss')).default;
  const tw = (await import('@tailwindcss/postcss')).default;
  const cssIn = `@import 'tailwindcss';\n@source '../src';\n@source '../content';`;
  const res = await postcss([tw()]).process(cssIn, { from: path.join(app, 'spa-build.css'), to: path.join(out, 'tailwind.css') });
  tailwind = res.css;
} catch (err) {
  console.warn('tailwind generation failed, falling back to CDN script:', err.message);
}
const pageCss = fs.readFileSync(path.join(src, 'spa/page.css'), 'utf8');
const html = `<title>Stats Trainer</title>
<meta name="description" content="Section-by-section quizzes, mistake review and printable tests for OpenStax Introductory Statistics 2e." />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Source+Sans+3:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap" />
${tailwind ? `<style>${tailwind}</style>` : '<script src="https://cdn.tailwindcss.com"></script>'}
<style>${pageCss}</style>
<div id="root"></div>
<script src="app.js"></script>
`;
fs.writeFileSync(path.join(out, 'index.html'), html);
const size = fs.statSync(path.join(out, 'app.js')).size;
console.log(`spa-dist/app.js ${(size / 1024 / 1024).toFixed(2)} MB, tailwind ${tailwind ? (tailwind.length / 1024).toFixed(0) + ' KB inlined' : 'CDN'}`);
