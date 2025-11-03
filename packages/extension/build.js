/**
 * Build script for DOMINATRIX extension
 * Copies necessary files to dist/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.join(__dirname, 'build');
const distDir = path.join(__dirname, 'dist');

// Create dist directory
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy compiled JS files from build to dist
const filesToCopy = ['background.js', 'content-script.js', 'popup.js', 'types.js'];
for (const file of filesToCopy) {
  const srcPath = path.join(buildDir, file);
  const destPath = path.join(distDir, file);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
  }
}

// Copy manifest.json
fs.copyFileSync(
  path.join(__dirname, 'manifest.json'),
  path.join(distDir, 'manifest.json')
);

// Copy popup.html
fs.copyFileSync(
  path.join(__dirname, 'src', 'popup.html'),
  path.join(distDir, 'popup.html')
);

// Copy icons directory
const iconsDir = path.join(distDir, 'icons');
const srcIconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Copy icon files
const sizes = [16, 32, 48, 128];
for (const size of sizes) {
  const srcIconPath = path.join(srcIconsDir, `icon${size}.png`);
  const destIconPath = path.join(iconsDir, `icon${size}.png`);
  if (fs.existsSync(srcIconPath)) {
    fs.copyFileSync(srcIconPath, destIconPath);
    console.log(`✅ Copied icon${size}.png`);
  } else {
    console.log(`⚠️  Warning: icon${size}.png not found in source`);
  }
}

// Read and display version
const manifest = JSON.parse(fs.readFileSync(path.join(distDir, 'manifest.json'), 'utf8'));
console.log('');
console.log('✅ Extension build complete!');
console.log(`📦 Output: packages/extension/dist/`);
console.log(`🔢 Version: ${manifest.version}`);
console.log('');
console.log('To load in Chrome:');
console.log('  1. Go to chrome://extensions/');
console.log('  2. Enable "Developer mode"');
console.log('  3. Click "Load unpacked"');
console.log('  4. Select the dist/ directory');
console.log('');
console.log('💡 Remember to reload the extension in Chrome to see changes!');
