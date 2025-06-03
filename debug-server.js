#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 HAFAZAN DEBUG - Checking potential 404 sources...\n');

// Check 1: Verify index.html exists
console.log('1. ✅ Checking index.html...');
const indexPath = join(__dirname, 'index.html');
if (existsSync(indexPath)) {
  console.log('   ✅ index.html exists');
  const content = readFileSync(indexPath, 'utf8');
  if (content.includes('src="/src/main.jsx"')) {
    console.log('   ✅ index.html correctly references main.jsx');
  } else {
    console.log('   ❌ index.html missing main.jsx reference');
  }
} else {
  console.log('   ❌ index.html is MISSING - This is likely the main issue!');
}

// Check 2: Verify main entry point exists
console.log('\n2. ✅ Checking main.jsx...');
const mainPath = join(__dirname, 'src', 'main.jsx');
if (existsSync(mainPath)) {
  console.log('   ✅ src/main.jsx exists');
} else {
  console.log('   ❌ src/main.jsx is missing');
}

// Check 3: Verify package.json dev script
console.log('\n3. ✅ Checking package.json scripts...');
const packagePath = join(__dirname, 'package.json');
if (existsSync(packagePath)) {
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
  if (pkg.scripts && pkg.scripts.dev) {
    console.log(`   ✅ Dev script found: "${pkg.scripts.dev}"`);
  } else {
    console.log('   ❌ No dev script found in package.json');
  }
}

// Check 4: Check if port 3000 is in use
console.log('\n4. ✅ Checking if port 3000 is available...');
try {
  const netstat = spawn('lsof', ['-i', ':3000'], { stdio: ['ignore', 'pipe', 'ignore'] });
  
  let output = '';
  netstat.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  netstat.on('close', (code) => {
    if (output.trim()) {
      console.log('   ⚠️  Port 3000 is in use:');
      console.log('   ' + output.trim());
      console.log('   💡 Try stopping the existing process or use a different port');
    } else {
      console.log('   ✅ Port 3000 is available');
    }
    
    // Check 5: Try to start dev server
    console.log('\n5. ✅ Attempting to start dev server...');
    console.log('   📝 Running: npm run dev');
    console.log('   ⏳ This will attempt to start the server...\n');
    
    const devServer = spawn('npm', ['run', 'dev'], { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    
    setTimeout(() => {
      console.log('\n⏹️  Server start attempted. Check the output above.');
      console.log('📝 If successful, try accessing http://localhost:3000 again');
      console.log('❌ If failed, check the error messages above');
      process.exit(0);
    }, 5000);
  });
  
} catch (error) {
  console.log('   ⚠️  Could not check port (lsof not available)');
  console.log('   💡 Try running: npm run dev');
} 