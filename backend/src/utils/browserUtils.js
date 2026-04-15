import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteerExtra.use(StealthPlugin());

// ---------------------------------------------------------------------------
// Rotating User-Agent pool — different Chrome versions & one Firefox
// to avoid fingerprint monotony across repeated scraper launches
// ---------------------------------------------------------------------------
const USER_AGENT_POOL = [
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    secChUa: '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    platform: '"Windows"',
  },
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    secChUa: '"Chromium";v="123", "Google Chrome";v="123", "Not-A.Brand";v="99"',
    platform: '"Windows"',
  },
  {
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    secChUa: '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    platform: '"macOS"',
  },
  {
    ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    secChUa: '"Chromium";v="122", "Google Chrome";v="122", "Not-A.Brand";v="99"',
    platform: '"Linux"',
  },
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
    secChUa: null, // Firefox does not send sec-ch-ua
    platform: '"Windows"',
  },
];

function pickRandomAgent() {
  return USER_AGENT_POOL[Math.floor(Math.random() * USER_AGENT_POOL.length)];
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const launchStealthBrowser = async () => {
  console.log('[BrowserUtils] Launching stealth browser...');
  return await puppeteerExtra.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--disable-dev-shm-usage',
      '--disable-features=VizDisplayCompositor',
      '--window-size=1366,768',
    ],
  });
};

export const configurePage = async (page, source = 'Unknown') => {
  console.log(`[BrowserUtils] [${source}] Configuring page parameters...`);

  const agent = pickRandomAgent();

  // Spoof navigator.webdriver = false (reinforces stealth plugin)
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  await page.setViewport({
    width:  1366 + Math.floor(Math.random() * 200),  // slight size variation
    height: 768  + Math.floor(Math.random() * 100),
    deviceScaleFactor: 1,
  });

  await page.setUserAgent(agent.ua);

  const extraHeaders = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-User': '?1',
    'Sec-Fetch-Dest': 'document',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': agent.platform,
  };
  if (agent.secChUa) extraHeaders['sec-ch-ua'] = agent.secChUa;

  await page.setExtraHTTPHeaders(extraHeaders);
};

export const emulateHumanBehavior = async (page, source = 'Unknown') => {
  const jitter = 500 + Math.random() * 1500;
  console.log(`[BrowserUtils] [${source}] Entering human delay jitter for ${Math.floor(jitter)}ms...`);
  await new Promise(r => setTimeout(r, jitter));
  console.log(`[BrowserUtils] [${source}] Exited human delay jitter.`);
};

export const emulateHumanScrolling = async (page, source = 'Unknown') => {
  console.log(`[BrowserUtils] [${source}] Starting human scrolling emulation in page.evaluate...`);
  try {
    await page.evaluate(async () => {
      await new Promise(resolve => {
        let totalHeight = 0;
        const distance = 150;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= 600) {
            clearInterval(timer);
            resolve();
          }
        }, 150);
      });
    });
    console.log(`[BrowserUtils] [${source}] Finished human scrolling emulation.`);
  } catch (err) {
    console.warn(`[BrowserUtils] [${source}] Ignoring error during human scrolling:`, err.message);
  }
};

export const detectBotBlock = (pageTitle, source = 'Scraper') => {
  const normalizedTitle = pageTitle.toLowerCase();
  if (
    normalizedTitle.includes('robot check') ||
    normalizedTitle.includes('captcha') ||
    normalizedTitle.includes('are you a human') ||
    normalizedTitle.includes('access denied') ||
    normalizedTitle.includes('403 forbidden') ||
    normalizedTitle.includes('blocked')
  ) {
    const err = new Error(`Anti-bot detected: "${pageTitle}" from ${source}`);
    err.scraperStatus = 'Error';
    throw err;
  }
};
