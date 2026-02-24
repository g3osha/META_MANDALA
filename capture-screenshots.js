const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir);

  const shot = async (name) => {
    await page.screenshot({
      path: path.join(screenshotsDir, name + '.jpg'),
      type: 'jpeg',
      quality: 75
    });
    console.log('  saved:', name + '.jpg');
  };

  console.log('Navigating...');
  await page.goto('http://localhost:8889', { waitUntil: 'networkidle0' });
  await page.waitForSelector('#mandalaCanvas');
  await new Promise(r => setTimeout(r, 2000));

  // 4. Fractal tradition
  console.log('4/6: Fractal tradition...');
  await page.click('#btnAscii');
  await new Promise(r => setTimeout(r, 300));
  await page.click('[data-tradition="fractal"]');
  await new Promise(r => setTimeout(r, 800));
  await shot('04-fractal-tradition');

  // 5. Random with glitch
  console.log('5/6: Random + glitch...');
  await page.click('[data-tradition="shingon"]');
  await new Promise(r => setTimeout(r, 300));
  await page.click('#btnGenerate');
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => {
    document.getElementById('rgbShift').value = 10;
    document.getElementById('rgbShift').dispatchEvent(new Event('input'));
    document.getElementById('noise').value = 20;
    document.getElementById('noise').dispatchEvent(new Event('input'));
    document.getElementById('scanlines').value = 50;
    document.getElementById('scanlines').dispatchEvent(new Event('input'));
    document.getElementById('distortion').value = 6;
    document.getElementById('distortion').dispatchEvent(new Event('input'));
  });
  await new Promise(r => setTimeout(r, 500));
  await shot('05-shingon-glitch');

  // 6. Lotus palette + sacred objects
  console.log('6/6: Lotus + objects...');
  await page.evaluate(() => {
    document.getElementById('rgbShift').value = 0;
    document.getElementById('rgbShift').dispatchEvent(new Event('input'));
    document.getElementById('noise').value = 0;
    document.getElementById('noise').dispatchEvent(new Event('input'));
    document.getElementById('distortion').value = 0;
    document.getElementById('distortion').dispatchEvent(new Event('input'));
  });
  await page.click('[data-tradition="vajrayana"]');
  await new Promise(r => setTimeout(r, 300));
  await page.click('[data-palette="lotus"]');
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(() => {
    document.getElementById('objectType').value = 'dharmachakra';
    document.getElementById('objectType').dispatchEvent(new Event('change'));
    document.getElementById('objectCount').value = 8;
    document.getElementById('objectCount').dispatchEvent(new Event('input'));
    document.getElementById('objectRing').value = 5;
    document.getElementById('objectRing').dispatchEvent(new Event('input'));
    document.getElementById('filledMode').checked = true;
    document.getElementById('filledMode').dispatchEvent(new Event('change'));
  });
  await new Promise(r => setTimeout(r, 800));
  await shot('06-lotus-objects-filled');

  await browser.close();
  console.log('\nDone!');
})();
