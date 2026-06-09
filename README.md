# CaptchaSonic Playwright Examples — Solve Any Captcha in TypeScript

> **Automate captcha solving** with [Playwright](https://playwright.dev) and the [CaptchaSonic](https://captchasonic.com) API or browser extension. Works with reCAPTCHA v2, reCAPTCHA v3, Cloudflare Turnstile, Geetest v4, AWS WAF, and image captchas.

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/Captcha-Sonic/captchasonic-playwright-examples.git
cd captchasonic-playwright-examples
npm install

# 2. Install Playwright browsers
npx playwright install chromium

# 3. Configure your API key
cp .env.example .env
# Edit .env and add your API key

# 4. Run any example
npm run recaptcha-v2
```

Get your API key at [captchasonic.com](https://captchasonic.com).

---

## Supported Captcha Types

| Captcha | Token Method | Extension Method | Run Command |
|---------|:---:|:---:|---|
| reCAPTCHA v2 | ✅ | ✅ | `npm run recaptcha-v2` |
| reCAPTCHA v3 | ✅ | ✅ | `npm run recaptcha-v3` |
| Cloudflare Turnstile | ✅ | ✅ | `npm run turnstile` |
| Geetest v4 | ✅ | ✅ | `npm run geetest` |
| AWS WAF | ✅ | ✅ | `npm run aws-waf` |
| Image Captcha (OCR) | ✅ | ✅ | `npm run image-captcha` |
| Popular Captcha | ✅ | ✅ | `npm run popularcaptcha` |

---

## Two Ways to Solve

### Token Method (`token-method.ts`)

Uses the CaptchaSonic API to solve captchas **server-side** — no visible browser interaction needed.

```
Your script → CaptchaSonic API → returns token → inject into page → submit
```

Best for: **headless automation**, **CI/CD pipelines**, **maximum speed**

### Extension Method (`extension-method.ts`)

Loads the CaptchaSonic **browser extension** into Chromium. The extension auto-detects and solves captchas as they appear.

```
Load extension → navigate to page → extension auto-solves → submit
```

Best for: **visual debugging**, **complex pages with multiple captchas**, **stealth browsing**

#### Extension Setup

1. **Build the extension** (or download from [Chrome Web Store](https://captchasonic.com/extension)):
   ```bash
   cd /path/to/captcha-sonic-ext
   npm run build:chrome
   ```

2. **Add the extension path** to your `.env` file:
   ```env
   CAPTCHASONIC_EXT_PATH=/path/to/captcha-sonic-ext/.output/chrome-mv3
   ```

3. **Run any extension example**:
   ```bash
   npm run recaptcha-v2:ext
   ```

4. **First run only** — when Chromium opens, click the CaptchaSonic extension icon in the toolbar and paste your API key. The key is saved automatically for all future runs.

---

## Project Structure

```
captchasonic-playwright-examples/
├── shared/
│   └── helpers.ts                  # Reusable utilities
├── examples/
│   ├── recaptcha-v2/
│   │   ├── token-method.ts         # API token solve
│   │   └── extension-method.ts     # Extension auto-solve
│   ├── recaptcha-v3/
│   │   ├── token-method.ts
│   │   └── extension-method.ts
│   ├── turnstile/
│   │   ├── token-method.ts
│   │   └── extension-method.ts
│   ├── geetest/
│   │   ├── token-method.ts
│   │   └── extension-method.ts
│   ├── aws-waf/
│   │   ├── token-method.ts
│   │   └── extension-method.ts
│   ├── image-captcha/
│   │   ├── token-method.ts
│   │   └── extension-method.ts
│   └── popularcaptcha/
│       ├── token-method.ts
│       └── extension-method.ts
├── package.json
└── tsconfig.json
```

---

## All Commands

```bash
# Token method (API-based)
npm run recaptcha-v2          # Solve reCAPTCHA v2
npm run recaptcha-v3          # Solve reCAPTCHA v3
npm run turnstile             # Solve Cloudflare Turnstile
npm run geetest               # Solve Geetest v4
npm run aws-waf               # Solve AWS WAF
npm run image-captcha         # Solve image/text captcha (OCR)
npm run popularcaptcha         # Solve popular captcha

# Extension method (browser extension)
npm run recaptcha-v2:ext
npm run recaptcha-v3:ext
npm run turnstile:ext
npm run geetest:ext
npm run aws-waf:ext
npm run image-captcha:ext
npm run popularcaptcha:ext
```

---

## Environment Variables

All variables are loaded from a `.env` file in the project root. Copy the template to get started:

```bash
cp .env.example .env
```

Then edit `.env`:

```env
# Required for all examples
CAPTCHASONIC_API_KEY=sonic_your_key_here

# Required for extension examples only
CAPTCHASONIC_EXT_PATH=/path/to/captcha-sonic-ext/.output/chrome-mv3
```

| Variable | Required | Description |
|---|:---:|---|
| `CAPTCHASONIC_API_KEY` | ✅ | Your CaptchaSonic API key (`sonic_xxx`) |
| `CAPTCHASONIC_EXT_PATH` | Extension only | Path to built CaptchaSonic Chrome extension |

---

## Adapt to Your Site

Each example targets a public demo page. To use on your own site:

1. Open any `token-method.ts`
2. Change `SITE_URL` to your target page
3. Change `SITE_KEY` to the captcha key on that page
4. Run the script

```typescript
// Before
const SITE_URL = 'https://recaptcha-demo.appspot.com/recaptcha-v2-checkbox.php';
const SITE_KEY = '6LfW6wATAAAAAHLqO2pb8bDBahxlMxNdo9g947u9';

// After — your site
const SITE_URL = 'https://yoursite.com/login';
const SITE_KEY = 'your-site-key-here';
```

---

## Requirements

- **Node.js** ≥ 18
- **Playwright** — installed automatically via `npm install`
- **CaptchaSonic API key** — [get one here](https://captchasonic.com)

---

## Resources

- [CaptchaSonic Documentation](https://docs.captchasonic.com)
- [CaptchaSonic Dashboard](https://captchasonic.com)
- [Playwright Documentation](https://playwright.dev)
- [Selenium Python Examples](https://github.com/Captcha-Sonic/captchasonic-selenium-python-examples)

---

## License

MIT — free to use in commercial projects.
