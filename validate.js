#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating JavaScript files...\n');

const files = ['engine.js', 'glitch.js', 'gif.js', 'app.js'];
let allValid = true;

files.forEach(file => {
  try {
    const filePath = path.join(__dirname, file);
    const code = fs.readFileSync(filePath, 'utf8');
    
    // Try to parse the code
    new Function(code);
    console.log(`✅ ${file} - No syntax errors`);
  } catch (error) {
    console.log(`❌ ${file} - Syntax error:`);
    console.log(`   ${error.message}`);
    allValid = false;
  }
});

console.log('\n' + '='.repeat(50));
if (allValid) {
  console.log('✅ All JavaScript files are valid!');
} else {
  console.log('❌ Some files have syntax errors');
  process.exit(1);
}
