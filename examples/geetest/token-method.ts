/**
 * Geetest v4 — Token Method (Playwright + CaptchaSonic)
 * ======================================================
 * Captures the Geetest nine-grid tiles, sends them to CaptchaSonic
 * for AI classification, and clicks the correct tiles.
 *
 * Setup:  Add your API key to .env (see .env.example)
 * Usage:  npm run geetest
 */

import { chromium, Page } from 'playwright';
import { CaptchaSonic } from 'captchasonic';
import { getApiKey, printBalance, sleep } from '../../shared/helpers';

const SITE_URL = 'https://gt4.geetest.com/demov4/nine-popup-en.html';

async function getGeetestTiles(page: Page): Promise<{ tiles: Buffer[]; prompt: string }> {
  await page.waitForSelector('.geetest_item_img', { timeout: 15000 });

  const prompt = await page.$eval(
    '.geetest_tips_title',
    (el) => el.textContent?.trim() ?? ''
  ).catch(() => '');

  if (!prompt) {
    console.warn('  ⚠️  Could not extract prompt text — check selectors');
  }

  const tileElements = await page.$$('.geetest_item_img img');
  const tiles: Buffer[] = [];

  for (const el of tileElements) {
    const src = await el.getAttribute('src') ?? '';
    if (src.startsWith('data:')) {
      const b64 = src.split(',')[1];
      tiles.push(Buffer.from(b64, 'base64'));
    } else {
      tiles.push(await el.screenshot());
    }
  }

  return { tiles, prompt };
}

async function clickGeetestTiles(page: Page, indices: number[]): Promise<void> {
  const tiles = await page.$$('.geetest_item');
  for (const i of indices) {
    if (i < tiles.length) {
      await tiles[i].click();
      await sleep(300);
    }
  }
}

async function main() {
  const apiKey = getApiKey();
  console.log('🔊 CaptchaSonic — Geetest v4 Nine-Grid Solver (Playwright)');
  console.log(`   Target: ${SITE_URL}\n`);

  const client = new CaptchaSonic(apiKey, { transport: 'http' });
  await printBalance(client);

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });
    await sleep(2000);

    // Trigger Geetest challenge
    await page.click('.geetest_btn, button[class*="geetest"]').catch(() => {});
    await sleep(1500);

    const { tiles, prompt } = await getGeetestTiles(page);
    console.log(`  Prompt: '${prompt}'`);
    console.log(`  Tiles: ${tiles.length} images`);

    console.log('⏳ Sending to CaptchaSonic...');
    const result = await client.solveGeetest({
      type: 'nine',
      question: prompt,
      images: tiles,
      websiteURL: SITE_URL,
    });

    const r = result as Record<string, unknown>;
    const grid = (r.typedSolution as Record<string, unknown> | undefined)?.grid as Record<string, unknown> | undefined;
    const objects: boolean[] = (grid?.objects as boolean[]) ?? [];
    const clickIndices = objects.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
    console.log(`  ✅ Click indices: ${clickIndices}`);

    await clickGeetestTiles(page, clickIndices);

    await page.click('.geetest_commit_tip, .geetest_next_tip').catch(() => {});
    await sleep(3000);
    console.log('  ✅ Geetest solved!');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
