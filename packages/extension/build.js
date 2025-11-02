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

// Create icons directory
const iconsDir = path.join(distDir, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create placeholder icons (we'll make real ones later)
const sizes = [16, 32, 48, 128];
for (const size of sizes) {
  const iconPath = path.join(iconsDir, `icon${size}.png`);
  if (!fs.existsSync(iconPath)) {
    // Create a simple SVG placeholder and note for later
    console.log(`⚠️  TODO: Create icon${size}.png (placeholder created)`);
    fs.writeFileSync(
      path.join(iconsDir, `icon${size}.txt`),
      `Placeholder for ${size}x${size} icon. TODO: Create actual PNG icon.`
    );
  }
}

console.log('✅ Extension build complete!');
console.log('📦 Output: packages/extension/dist/');
console.log('');
console.log('To load in Chrome:');
console.log('  1. Go to chrome://extensions/');
console.log('  2. Enable "Developer mode"');
console.log('  3. Click "Load unpacked"');
console.log('  4. Select the dist/ directory');
