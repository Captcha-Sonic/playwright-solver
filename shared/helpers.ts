/**
 * Shared helper utilities for CaptchaSonic Playwright examples.
 */

import { Page, BrowserContext } from 'playwright';

/** Load API key from environment or throw a clear error. */
export function getApiKey(): string {
  const key = process.env.CAPTCHASONIC_API_KEY ?? '';
  if (!key) {
    throw new Error(
      'CAPTCHASONIC_API_KEY is not set.\n' +
      'Get your key at: https://captchasonic.com\n' +
      'Then run: export CAPTCHASONIC_API_KEY=sonic_your_key_here'
    );
  }
  return key;
}

/** Inject a solved reCAPTCHA v2/v3 token into the page. */
export async function injectRecaptchaToken(page: Page, token: string): Promise<void> {
  await page.evaluate((t) => {
    const ta = document.getElementById('g-recaptcha-response') as HTMLTextAreaElement | null;
    if (ta) {
      ta.style.display = 'block';
      ta.value = t;
    }
    // Handle all hidden textareas (invisible reCAPTCHA)
    document.querySelectorAll<HTMLTextAreaElement>('[name="g-recaptcha-response"]').forEach(
      (el) => { el.value = t; }
    );
  }, token);
}

/** Inject a solved Cloudflare Turnstile token into the page. */
export async function injectTurnstileToken(page: Page, token: string): Promise<void> {
  await page.evaluate((t) => {
    document.querySelectorAll<HTMLInputElement>('[name="cf-turnstile-response"]').forEach(
      (el) => { el.value = t; }
    );
  }, token);
}

/** Print account balance to console. */
export async function printBalance(client: any): Promise<void> {
  try {
    const balance: number = await client.getBalance();
    console.log(`  💰 Balance: $${balance.toFixed(4)}`);
  } catch (e) {
    console.log(`  ⚠️  Could not fetch balance: ${(e as Error).message}`);
  }
}

/**
 * Wait for a reCAPTCHA v2 checkbox to show as solved.
 * Uses frame switching + DOM polling — equivalent to CapSolver's DOM observation.
 * CaptchaSonic's token approach doesn't need this, but it's useful for extension method.
 */
export async function waitForRecaptchaSolve(page: Page, timeoutMs = 60_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const frame = page.frame({ url: /recaptcha.*anchor/ });
      if (frame) {
        const cls = await frame.$eval('#recaptcha-anchor', (el) => el.className);
        if (cls.includes('recaptcha-checkbox-checked')) return true;
      }
    } catch { /* keep polling */ }
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

/** Helper: sleep for N milliseconds. */
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
