# CaptchaSonic Playwright Examples

> **Solve any CAPTCHA in your Playwright scripts with 3 lines of TypeScript.**

Official integration examples for using [CaptchaSonic](https://captchasonic.com) with [Playwright](https://playwright.dev) in TypeScript/Node.js.

[![npm](https://img.shields.io/npm/v/@captchasonic/sdk)](https://www.npmjs.com/package/@captchasonic/sdk)
[![Node.js](https://img.shields.io/badge/node-18%2B-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Why CaptchaSonic?

```typescript
// ❌ Other services — 20+ lines of manual polling:
const res = await fetch('https://api.othercaptchaservice.com/createTask', { body: JSON.stringify({...}) });
const taskId = (await res.json()).taskId;
let token = '';
while (!token) {
  await new Promise(r => setTimeout(r, 3000));
  const poll = await (await fetch('https://api.othercaptchaservice.com/getTaskResult', {...})).json();
  if (poll.status === 'ready') token = poll.solution.gRecaptchaResponse;
}
// ... inject token ...

// ✅ CaptchaSonic — 3 lines:
import { CaptchaSonic } from '@captchasonic/sdk';

const client = new CaptchaSonic('sonic_your_key_here');
const result = await client.solveRecaptchaV2Token({ websiteURL: url, websiteKey: sitekey });
const token = result.solution['gRecaptchaResponse'];
```

CaptchaSonic handles polling, retries, and error mapping internally — via a native **gRPC** connection with TypeScript types throughout.

---

## Supported CAPTCHAs

| CAPTCHA Type | Method | Example |
|---|---|---|
| **reCAPTCHA v2** | Token injection | [`examples/recaptcha-v2/`](examples/recaptcha-v2/) |
| **reCAPTCHA v3** | Score token injection | [`examples/recaptcha-v3/`](examples/recaptcha-v3/) |
| **Cloudflare Turnstile** | Token injection | [`examples/turnstile/`](examples/turnstile/) |
| **Geetest v4** (nine-grid) | Grid classification + click | [`examples/geetest/`](examples/geetest/) |
| **AWS WAF Captcha** | Grid classification + click | [`examples/aws-waf/`](examples/aws-waf/) |
| **Image-to-Text / OCR** | Text extraction | [`examples/image-captcha/`](examples/image-captcha/) |
| **Extension (auto-solve)** | Auto via browser extension | [`examples/extension/`](examples/extension/) |

---

## Quick Start

### 1. Install dependencies

```bash
npm install
npx playwright install chromium
```

### 2. Set your API key

Get your key at [captchasonic.com](https://captchasonic.com) → Dashboard → API Keys.

```bash
export CAPTCHASONIC_API_KEY=sonic_your_key_here
```

### 3. Run an example

```bash
# reCAPTCHA v2 — token method (fastest, start here)
npx ts-node examples/recaptcha-v2/token-method.ts

# reCAPTCHA v3
npx ts-node examples/recaptcha-v3/score-token.ts

# Cloudflare Turnstile
npx ts-node examples/turnstile/turnstile-solver.ts

# Geetest v4
npx ts-node examples/geetest/geetest-solver.ts

# AWS WAF
npx ts-node examples/aws-waf/aws-waf-solver.ts

# Image-to-Text
npx ts-node examples/image-captcha/image-to-text.ts
```

---

## Integration Pattern

All examples follow the same 3-step pattern:

```typescript
import { chromium } from 'playwright';
import { CaptchaSonic } from '@captchasonic/sdk';

// 1. Solve with CaptchaSonic SDK
const client = new CaptchaSonic(process.env.CAPTCHASONIC_API_KEY!);
const result = await client.solveRecaptchaV2Token({
  websiteURL: 'https://example.com',
  websiteKey: '6Le-wvkSAAAAAPBMRTvw0Q4Muexq9bi0DJwx_mJ-',
});

// 2. Extract token
const token = result.solution['gRecaptchaResponse'];

// 3. Inject into Playwright page
await page.evaluate((t) => {
  (document.getElementById('g-recaptcha-response') as HTMLTextAreaElement).value = t;
}, token);
```

---

## Extension Method + `postMessage` Trigger

CaptchaSonic's browser extension supports a **`postMessage` on-demand trigger** — fire captcha solving at exactly the right moment:

```typescript
// Auto-solve when page loads (extension detects captcha automatically)
// OR trigger manually when you're ready:
await page.evaluate(() => {
  window.postMessage({ type: 'capsonicSolve' }, '*');
});
```

This is especially important for multi-step forms where:
1. You fill in the form fields first
2. Then solve the captcha right before submit (tokens expire in 120s)

See [`examples/extension/extension-method.ts`](examples/extension/extension-method.ts) for the full implementation.

---

## Proxy Support

```typescript
const result = await client.solveRecaptchaV2Token({
  websiteURL: 'https://example.com',
  websiteKey: '...',
  proxy: 'http://user:pass@host:port', // socks5 also supported
});
```

---

## TypeScript Support

The CaptchaSonic SDK is TypeScript-first with complete types:

```typescript
import { CaptchaSonic, SonicError, TaskNotReadyError } from '@captchasonic/sdk';

const client = new CaptchaSonic('sonic_xxx'); // fully typed

try {
  const result = await client.solveTurnstile({
    websiteURL: 'https://example.com',
    websiteKey: '0x4AAAAAAA...',
  });
  // result is fully typed
  const token: string = result.solution['token'];
} catch (e) {
  if (e instanceof TaskNotReadyError) {
    console.log('Solve timed out');
  }
}
```

---

## Project Structure

```
captchasonic-playwright-examples/
├── package.json
├── tsconfig.json
├── shared/
│   └── helpers.ts                    # Shared utilities
└── examples/
    ├── recaptcha-v2/
    │   └── token-method.ts           # ⭐ Start here
    ├── recaptcha-v3/
    │   └── score-token.ts
    ├── turnstile/
    │   └── turnstile-solver.ts
    ├── geetest/
    │   └── geetest-solver.ts
    ├── aws-waf/
    │   └── aws-waf-solver.ts
    ├── image-captcha/
    │   └── image-to-text.ts
    └── extension/
        └── extension-method.ts       # postMessage trigger demo
```

---

## Links

- 🌐 [CaptchaSonic](https://captchasonic.com)
- 📦 [npm: @captchasonic/sdk](https://www.npmjs.com/package/@captchasonic/sdk)
- 📖 [Docs](https://docs.captchasonic.com)
- 🤖 [n8n Node](https://www.npmjs.com/package/n8n-nodes-captchasonic)
- 🔧 [MCP Server](https://www.npmjs.com/package/@captchasonic/mcp-server)
- 🐍 [Selenium Python Examples](https://github.com/captchasonic/captchasonic-selenium-python-examples)

---

## License

MIT © [CaptchaSonic](https://captchasonic.com)
