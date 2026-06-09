/**
 * Browser Extension Auto-Solve Method (Playwright)
 * =================================================
 * Load the CaptchaSonic browser extension into Playwright Chromium.
 * The extension auto-solves captchas as you browse.
 *
 * This demonstrates the `postMessage` trigger API for on-demand solving:
 *   window.postMessage({ type: 'capsonicSolve' })
 *
 * Chrome 137+ Note:
 *   Chromium in Playwright handles extensions differently from Selenium.
 *   Use `chromium.launchPersistentContext` with `args: ['--load-extension=...']`
 *
 * Prerequisites:
 *   1. Download/build CaptchaSonic extension
 *   2. export CAPTCHASONIC_EXT_PATH=/path/to/unpacked/extension
 *   3. export CAPTCHASONIC_API_KEY=sonic_your_key
 *
 * Usage:
 *   npx ts-node examples/extension/extension-method.ts
 */

import path from 'path';
import { chromium } from 'playwright';
import { getApiKey, waitForRecaptchaSolve } from '../../shared/helpers';

const SITE_URL = 'https://recaptcha-demo.appspot.com/recaptcha-v2-checkbox.php';
const EXT_PATH = process.env.CAPTCHASONIC_EXT_PATH ?? '';

async function main() {
  const apiKey = getApiKey();

  if (!EXT_PATH) {
    console.error(
      '⚠️  CAPTCHASONIC_EXT_PATH not set.\n' +
      '   Download extension from: https://captchasonic.com/extension\n' +
      '   Then: export CAPTCHASONIC_EXT_PATH=/path/to/unpacked/extension'
    );
    process.exit(1);
  }

  console.log('🔊 CaptchaSonic — Browser Extension Auto-Solve (Playwright)');
  console.log(`   Extension: ${EXT_PATH}`);
  console.log(`   Target: ${SITE_URL}\n`);

  // Playwright uses launchPersistentContext for extensions (not launch())
  const userDataDir = path.join(process.cwd(), '.playwright-user-data');
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false, // Extensions require headful mode
    args: [
      `--load-extension=${EXT_PATH}`,
      `--disable-extensions-except=${EXT_PATH}`,
      '--start-maximized',
      // Chrome 137+ compatibility fix:
      '--disable-features=DisableLoadExtensionCommandLineSwitch',
    ],
  });

  const page = await context.newPage();

  try {
    // Give extension time to initialize
    await page.waitForTimeout(2000);

    // Configure extension via postMessage (avoids manual popup interaction)
    // The extension listens for this to set the API key programmatically
    await page.evaluate((key) => {
      window.postMessage({ type: 'capsonicSetKey', apiKey: key }, '*');
    }, apiKey);

    console.log('🌐 Navigating to target page...');
    await page.goto(SITE_URL, { waitUntil: 'networkidle' });

    // ── Method 1: Wait for extension to auto-solve ──────────────────────────
    console.log('⏳ Waiting for extension to auto-solve captcha...');
    const solved = await waitForRecaptchaSolve(page, 60_000);

    if (solved) {
      console.log('  ✅ Captcha auto-solved by extension!');
    } else {
      // ── Method 2: Trigger solve on-demand via postMessage ────────────────
      console.log('  🔄 Triggering solve via postMessage...');
      await page.evaluate(() => {
        window.postMessage({ type: 'capsonicSolve' }, '*');
      });

      const retriggered = await waitForRecaptchaSolve(page, 30_000);
      if (!retriggered) {
        console.log('  ⚠️  Extension solve timed out — check API key configuration');
        return;
      }
      console.log('  ✅ Captcha solved via postMessage trigger!');
    }

    // Submit form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('  ✅ Form submitted!');
  } finally {
    await context.close();
  }
}

main().catch(console.error);
