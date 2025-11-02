/**
 * Bundle script for DOMINATRIX extension
 * Uses Bun's bundler to create proper extension files
 */

import { $ } from 'bun';

console.log('🔥 Bundling DOMINATRIX extension...');

// Create build directory
await $`mkdir -p build`;

// Bundle background worker (can use ES modules)
await Bun.build({
  entrypoints: ['./src/background.ts'],
  outdir: './build',
  target: 'browser',
  format: 'esm',
  sourcemap: 'external',
});

// Bundle content script (CANNOT use ES modules - must be IIFE)
await Bun.build({
  entrypoints: ['./src/content-script.ts'],
  outdir: './build',
  target: 'browser',
  format: 'iife',  // Immediately Invoked Function Expression
  sourcemap: 'external',
});

// Bundle popup script (can use ES modules in service worker context)
await Bun.build({
  entrypoints: ['./src/popup.ts'],
  outdir: './build',
  target: 'browser',
  format: 'iife',  // IIFE for inline script
  sourcemap: 'external',
});

console.log('✅ Bundling complete!');
