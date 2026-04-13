import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteerExtra.use(StealthPlugin());

export const launchStealthBrowser = async () => {
  console.log('[BrowserUtils] Launching stealth browser...');
  return await puppeteerExtra.launch({
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });
};

export const configurePage = async (page, source = 'Unknown') => {
  console.log(`[BrowserUtils] [${source}] Configuring page parameters...`);
  await page.setViewport({ width: 1366, height: 768 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-User': '?1',
    'Sec-Fetch-Dest': 'document'
  });
};

export const emulateHumanBehavior = async (page, source = 'Unknown') => {
  // Randomized delay (jitter) before navigation
  const jitter = 500 + Math.random() * 1500;
  console.log(`[BrowserUtils] [${source}] Entering human delay jitter for ${Math.floor(jitter)}ms...`);
  await new Promise(r => setTimeout(r, jitter));
  console.log(`[BrowserUtils] [${source}] Exited human delay jitter.`);
};

export const emulateHumanScrolling = async (page, source = 'Unknown') => {
  console.log(`[BrowserUtils] [${source}] Starting human scrolling emulation in page.evaluate...`);
  
  // Emulate human-like scrolling
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
  if (normalizedTitle.includes('robot check') || normalizedTitle.includes('captcha') || normalizedTitle.includes('are you a human')) {
    throw new Error(`Anti-bot detected: Captcha page served from ${source}`);
  }
};
