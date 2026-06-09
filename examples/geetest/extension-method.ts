// Geetest v4 — Extension Method (Playwright + CaptchaSonic Extension)
// Setup: Copy .env.example to .env, add API key + extension path
// Usage: npm run geetest:ext

import { launchWithExtension, sleep } from '../../shared/helpers';

const SITE_URL = 'https://gt4.geetest.com/demov4/slide-popup-en.html';

async function main() {
  console.log('CaptchaSonic — Geetest v4 Extension Method');
  console.log(`Target: ${SITE_URL}\n`);

  const { context, page } = await launchWithExtension();

  try {
    console.log('Navigating to target page...');
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });
    await sleep(2000);

    // Trigger Geetest challenge
    console.log('Triggering Geetest challenge...');
    await page.click('.geetest_btn, button[class*="geetest"]').catch(() => {});
    await sleep(1500);

    console.log('Waiting for extension to solve Geetest...');

    let panelAppeared = false;
    const panelDeadline = Date.now() + 15_000;
    while (Date.now() < panelDeadline) {
      const panel = await page.$('.geetest_panel, .geetest_popup_wrap, .geetest_wind');
      if (panel) { panelAppeared = true; break; }
      await sleep(1000);
    }

    if (!panelAppeared) {
      console.log('Geetest challenge panel did not appear — try clicking the verify button manually');
    }

    const deadline = Date.now() + 120_000;
    let solved = false;
    while (Date.now() < deadline) {
      try {
        const success = await page.$('.geetest_success_radar_tip_content, .geetest_success, .geetest_result_tip');
        if (success) { solved = true; break; }

        if (panelAppeared) {
          const panel = await page.$('.geetest_panel, .geetest_popup_wrap, .geetest_wind');
          if (!panel) { solved = true; break; }
        }

        const extSolved = await page.evaluate(() => (window as any).captchaSolved === true);
        if (extSolved) { solved = true; break; }
      } catch { /* keep polling */ }
      await sleep(2000);
    }

    if (solved) {
      console.log('Geetest solved by extension!');
    } else {
      console.log('Extension solve timed out');
    }
  } finally {
    await context.close();
  }
}

main().catch(console.error);
