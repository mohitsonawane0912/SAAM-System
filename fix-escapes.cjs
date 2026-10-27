const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!['node_modules', '.git', 'dist'].includes(file)) {
        processDir(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
      if (file === 'fix-escapes.js') continue;
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix \` to `
      content = content.replace(/\\`/g, '`');
      
      // Fix \${ to ${
      content = content.replace(/\\\$\{/g, '${');
      
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

processDir(__dirname);
console.log('Fixed escapes in all TS/TSX files');
