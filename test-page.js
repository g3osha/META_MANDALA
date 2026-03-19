#!/usr/bin/env node

const http = require('http');
const fs = require('fs');

console.log('🧪 Testing META MANDALA page structure...\n');

// Test 1: Check if server is responding
http.get('http://localhost:8889', (res) => {
  console.log(`✅ Server responding on port 8889 (Status: ${res.statusCode})`);
  
  let html = '';
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    console.log('\n📋 Verifying page components:\n');
    
    const checks = [
      { name: 'ASCII Header with META MANDALA', pattern: /M E T A\s+M A N D A L A/ },
      { name: 'Canvas elements (mandalaCanvas, glitchCanvas)', pattern: /<canvas id="mandalaCanvas"[\s\S]*?<canvas id="glitchCanvas"/ },
      { name: 'Tradition buttons section', pattern: /<h3 class="section-title">◈ TRADITION<\/h3>/ },
      { name: 'Fractal tradition button with ◬ symbol', pattern: /data-tradition="fractal"[\s\S]*?◬/ },
      { name: 'Geometry controls section', pattern: /<h3 class="section-title">◈ GEOMETRY<\/h3>/ },
      { name: 'Line W slider (lineWidth)', pattern: /id="lineWidth"/ },
      { name: 'Inner Rot slider (innerRotation)', pattern: /id="innerRotation"/ },
      { name: 'Stroke-only mode checkbox', pattern: /id="strokeOnly"[\s\S]*?Stroke-only mode/ },
      { name: 'Fractal section with Depth slider', pattern: /<h3 class="section-title">◈ FRACTAL<\/h3>[\s\S]*?id="fractalDepth"/ },
      { name: 'Mantra encoding section', pattern: /<h3 class="section-title">◈ MANTRA ENCODING<\/h3>/ },
      { name: 'Shape toggle buttons', pattern: /class="shape-toggles"/ },
      { name: 'Glitch controls section (right panel)', pattern: /<h3 class="section-title">◈ GLITCH<\/h3>/ },
      { name: 'RGB Shift slider', pattern: /id="rgbShift"/ },
      { name: 'Noise slider', pattern: /id="noise"/ },
      { name: 'Scanlines slider', pattern: /id="scanlines"/ },
      { name: 'Color controls section', pattern: /<h3 class="section-title">◈ COLOR<\/h3>/ },
      { name: 'Hue Rotate slider', pattern: /id="hueRotate"/ },
      { name: 'Saturation slider', pattern: /id="saturation"/ },
      { name: 'Brightness slider', pattern: /id="brightness"/ },
      { name: 'Contrast slider', pattern: /id="contrast"/ },
      { name: 'Invert slider', pattern: /id="invert"/ },
      { name: 'Image upload section', pattern: /<h3 class="section-title">◈ IMAGE SOURCE<\/h3>/ },
      { name: 'Image Rotation control', pattern: /id="imageRotation"/ },
      { name: 'Image Threshold control', pattern: /id="imageThreshold"/ },
      { name: 'Image Kaleidoscope checkbox', pattern: /id="imageKaleidoscope"/ },
      { name: 'Image Edge detect checkbox', pattern: /id="imageEdgeDetect"/ },
      { name: 'GENERATE button', pattern: /id="btnGenerate"[\s\S]*?GENERATE/ },
      { name: 'ANIMATE button', pattern: /id="btnAnimate"[\s\S]*?ANIMATE/ },
      { name: 'EXPORT button', pattern: /id="btnExport"[\s\S]*?EXPORT/ },
      { name: 'GIF button with ⟐ symbol', pattern: /id="btnExportGif"[\s\S]*?⟐ GIF/ },
      { name: 'RANDOM button', pattern: /id="btnRandom"[\s\S]*?RANDOM/ },
      { name: 'GIF Export Modal', pattern: /id="gifModal"[\s\S]*?EXPORT GIF \/ WEBM/ },
      { name: 'JavaScript files loaded (engine.js)', pattern: /<script src="engine\.js"><\/script>/ },
      { name: 'JavaScript files loaded (glitch.js)', pattern: /<script src="glitch\.js"><\/script>/ },
      { name: 'JavaScript files loaded (gif.js)', pattern: /<script src="gif\.js"><\/script>/ },
      { name: 'JavaScript files loaded (app.js)', pattern: /<script src="app\.js"><\/script>/ },
    ];
    
    let passed = 0;
    let failed = 0;
    
    checks.forEach(check => {
      if (check.pattern.test(html)) {
        console.log(`  ✅ ${check.name}`);
        passed++;
      } else {
        console.log(`  ❌ ${check.name}`);
        failed++;
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 Results: ${passed} passed, ${failed} failed out of ${checks.length} checks`);
    
    if (failed === 0) {
      console.log('✅ All page components verified successfully!');
      console.log('\n💡 Note: JavaScript runtime errors can only be checked in a real browser.');
      console.log('   Open http://localhost:8889 and check the browser console (F12).');
    } else {
      console.log('❌ Some components are missing or incorrectly structured');
      process.exit(1);
    }
  });
}).on('error', (err) => {
  console.error(`❌ Error connecting to server: ${err.message}`);
  console.error('   Make sure the server is running on port 8889');
  process.exit(1);
});
