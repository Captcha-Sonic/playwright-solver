/**
 * Shared helper utilities for CaptchaSonic Playwright examples.
 */

import 'dotenv/config'; // Auto-load .env file
import path from 'path';
import { chromium, Page, BrowserContext } from 'playwright';

// ── API Key ─────────────────────────────────────────────────────────────────

/** Load API key from environment or throw a clear error. */
export function getApiKey(): string {
  const key = process.env.CAPTCHASONIC_API_KEY ?? '';
  if (!key) {
    throw new Error(
      'CAPTCHASONIC_API_KEY is not set.\n' +
      'Get your key at: https://captchasonic.com\n' +
      'Then add it to your .env file: CAPTCHASONIC_API_KEY=sonic_your_key_here'
    );
  }
  return key;
}

// ── Balance ─────────────────────────────────────────────────────────────────

/** Print account balance to console. */
export async function printBalance(client: any): Promise<void> {
  try {
    const balance: number = await client.getBalance();
    console.log(`  💰 Balance: $${balance.toFixed(4)}`);
  } catch (e) {
    console.log(`  ⚠️  Could not fetch balance: ${(e as Error).message}`);
  }
}

// ── Token Extraction ────────────────────────────────────────────────────────

/**
 * Safely extract a token from the SDK result regardless of response shape.
 * Handles both `result.solution.gRecaptchaResponse` and `result.solution.token`.
 */
export function extractToken(result: unknown): string {
  const r = result as Record<string, unknown>;
  const solution = (r.solution ?? r) as Record<string, string>;
  const token =
    solution['gRecaptchaResponse'] ??
    solution['token'] ??
    solution['cf-turnstile-response'] ??
    '';
  if (!token) {
    throw new Error(`No token found in result: ${JSON.stringify(r)}`);
  }
  return token;
}

// ── Token Injection ─────────────────────────────────────────────────────────

/** Inject a solved reCAPTCHA v2/v3 token into the page. */
export async function injectRecaptchaToken(page: Page, token: string): Promise<void> {
  await page.evaluate((t) => {
    const ta = document.getElementById('g-recaptcha-response') as HTMLTextAreaElement | null;
    if (ta) {
      ta.style.display = 'block';
      ta.value = t;
    }
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

// ── Extension Helpers ───────────────────────────────────────────────────────

/**
 * Launch Playwright with the CaptchaSonic browser extension loaded.
 * Returns a BrowserContext (not a Browser — Playwright requires
 * `launchPersistentContext` for extensions).
 */
export async function launchWithExtension(): Promise<{ context: BrowserContext; page: Page }> {
  const extPath = process.env.CAPTCHASONIC_EXT_PATH ?? '';
  if (!extPath) {
    console.error(
      '⚠️  CAPTCHASONIC_EXT_PATH not set.\n' +
      '   Build the extension or download from: https://captchasonic.com/extension\n' +
      '   Then add to your .env file: CAPTCHASONIC_EXT_PATH=/path/to/extension'
    );
    process.exit(1);
  }

  const userDataDir = path.join(process.cwd(), '.playwright-user-data');
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--load-extension=${extPath}`,
      `--disable-extensions-except=${extPath}`,
      '--disable-features=DisableLoadExtensionCommandLineSwitch',
    ],
  });

  const page = await context.newPage();
  await page.waitForTimeout(2000);

  return { context, page };
}

/**
 * Wait for the CaptchaSonic extension to auto-solve a captcha on the page.
 */
export async function waitForExtensionSolve(page: Page, timeoutMs = 120_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const solved = await page.evaluate(() => (window as any).captchaSolved === true);
      if (solved) return true;

      const recaptchaFrame = page.frame({ url: /recaptcha.*anchor/ });
      if (recaptchaFrame) {
        const cls = await recaptchaFrame.$eval('#recaptcha-anchor', (el) => el.className);
        if (cls.includes('recaptcha-checkbox-checked')) return true;
      }

      const turnstileFrame = page.frame({ url: /challenges\.cloudflare\.com/ });
      if (turnstileFrame) {
        const success = await turnstileFrame.$('[data-testid="success"]').catch(() => null);
        if (success) return true;
      }

      const hasToken = await page.evaluate(() => {
        const recaptcha = document.querySelector<HTMLTextAreaElement>('[name="g-recaptcha-response"]');
        if (recaptcha && recaptcha.value.length > 20) return true;

        const hcaptcha = document.querySelector<HTMLTextAreaElement>('[name="h-captcha-response"]');
        if (hcaptcha && hcaptcha.value.length > 20) return true;

        const turnstile = document.querySelector<HTMLInputElement>('[name="cf-turnstile-response"]');
        if (turnstile && turnstile.value.length > 20) return true;

        return false;
      });
      if (hasToken) return true;

    } catch { /* keep polling */ }
    await sleep(2000);
  }
  return false;
}

// ── Utilities ───────────────────────────────────────────────────────────────

/** Helper: sleep for N milliseconds. */
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
