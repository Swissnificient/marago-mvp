const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'public');
const destDir = path.join(rootDir, '.vercel', 'output', 'static');

fs.mkdirSync(destDir, { recursive: true });
fs.cpSync(srcDir, destDir, { recursive: true });

console.log('Successfully prepared static demo assets in .vercel/output/static');
