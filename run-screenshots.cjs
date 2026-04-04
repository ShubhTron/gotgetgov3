const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const URL = 'http://localhost:5173';
const OUTPUT_DIR = path.join(__dirname, 'screenshots-mobile');

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Mobile viewport parameters (iPhone 13-ish)
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  
  // Set a mobile User Agent to ensure any mobile logic triggers
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');

  console.log('Navigating to landing page...');
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_landing.png'), fullPage: true });

  console.log('Attempting to log in...');
  try {
    // 1. Click Sign In text button on landing page
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const signInBtn = buttons.find(b => b.textContent && b.textContent.includes('Sign In'));
      if (signInBtn) signInBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    // 2. Click "Continue with Email" button inside bottom sheet
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const emailBtn = buttons.find(b => b.textContent && b.textContent.includes('Continue with Email'));
      if (emailBtn) emailBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 1000));

    // 3. Type credentials
    await page.type('input[type="email"]', 'shubh6@gmail.com');
    await page.type('input[type="password"]', 'qwerty');
    
    // 4. Press enter to login
    await page.keyboard.press('Enter');
    
    // 5. Wait for navigation to complete
    console.log('Credentials entered, waiting for navigation...');
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 });
    } catch {
      console.log('No implicit navigation detected, waiting a bit longer.');
    }
    await new Promise(r => setTimeout(r, 3000));
  } catch (err) {
    console.error('Login error:', err.message);
  }

  const routes = [
    '/discover',
    '/news',
    '/schedule',
    '/results',
    '/circles',
    '/profile',
    '/notifications',
    '/settings'
  ];

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    console.log(`Navigating to ${route}...`);
    try {
      await page.goto(`${URL}${route}`, { waitUntil: 'networkidle0', timeout: 8000 });
      await new Promise(r => setTimeout(r, 1500)); // wait for animations/data fetch
      const filename = `1${i}_${route.substring(1)}.png`;
      await page.screenshot({ path: path.join(OUTPUT_DIR, filename), fullPage: true });
      console.log(`Saved screenshot ${filename}`);
    } catch (err) {
      console.error(`Error capturing ${route}:`, err.message);
    }
  }

  await browser.close();
  console.log('Done!');
}

run().catch(console.error);
