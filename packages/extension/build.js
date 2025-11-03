/**
 * Build script for DOMINATRIX extension
 * Copies necessary files to dist/ and replaces {VERSION} placeholder
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.join(__dirname, 'build');
const distDir = path.join(__dirname, 'dist');

// Read version from package.json (single source of truth)
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const VERSION = packageJson.version;

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

// Copy manifest.json and replace {VERSION}
let manifestContent = fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8');
manifestContent = manifestContent.replace(/{VERSION}/g, VERSION);
fs.writeFileSync(path.join(distDir, 'manifest.json'), manifestContent);

// Copy popup.html and replace {VERSION}
let popupContent = fs.readFileSync(path.join(__dirname, 'src', 'popup.html'), 'utf8');
popupContent = popupContent.replace(/{VERSION}/g, VERSION);
fs.writeFileSync(path.join(distDir, 'popup.html'), popupContent);

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

// Display build summary
console.log('');
console.log('✅ Extension build complete!');
console.log(`📦 Output: packages/extension/dist/`);
console.log(`🔢 Version: ${VERSION}`);
console.log('');
console.log('To load in Chrome:');
console.log('  1. Go to chrome://extensions/');
console.log('  2. Enable "Developer mode"');
console.log('  3. Click "Load unpacked"');
console.log('  4. Select the dist/ directory');
console.log('');
console.log('💡 Remember to reload the extension in Chrome to see changes!');
