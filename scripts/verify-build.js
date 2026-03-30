const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '../dist');
const indexPath = path.join(distPath, 'index.html');
const assetsPath = path.join(distPath, 'assets');

console.log('🔍 Starting Post-Build Verification...');

if (!fs.existsSync(distPath)) {
  console.error('❌ Error: "dist" folder not found! Build failed.');
  process.exit(1);
}

if (!fs.existsSync(indexPath)) {
  console.error('❌ Error: "dist/index.html" not found!');
  process.exit(1);
}

const mainHtml = fs.readFileSync(indexPath, 'utf8');
if (!mainHtml.includes('<script type="module"')) {
  console.error('❌ Error: "dist/index.html" does not contain a module script entry.');
  process.exit(1);
}

if (!fs.existsSync(assetsPath)) {
    console.error('❌ Warning: No assets folder found in dist.');
} else {
    const assets = fs.readdirSync(assetsPath);
    console.log(`✅ Build Verified: found ${assets.length} production assets.`);
}

console.log('✅ Post-Build Verification Successful.');
process.exit(0);
