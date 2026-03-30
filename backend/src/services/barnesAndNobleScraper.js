/**
 * barnesAndNobleScraper.js  (Stealth Edition)
 *
 * Probléma az eredetivel: Barnes & Noble felismeri a Headless Chrome-ot
 * (navigator.webdriver, hiányzó Chrome pluginek, stb.) és blokkolja.
 *
 * Megoldás: puppeteer-extra + puppeteer-extra-plugin-stealth
 *   – Automatikusan patcheli a webdriver jelenlétét
 *   – Randomizált User-Agent
 *   – Valódi böngészőre jellemző header fingerprintet állít be
 */

import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

// Stealth plugin egyszer inicializálva (singleton)
puppeteerExtra.use(StealthPlugin());

// Randomizált User-Agent pool — kerüli az egy UA ismételt detectálását
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.86 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
];

const getRandomUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

export const scrapeBarnesAndNoble = async (isbn) => {
  let browser = null;
  try {
    browser = await puppeteerExtra.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--window-size=1366,768",
      ],
    });

    const page = await browser.newPage();

    // Randomizált viewport — valódibb böngészőt imitál
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent(getRandomUA());

    // Valódi böngészőre jellemző extra headerek
    await page.setExtraHTTPHeaders({
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-User": "?1",
      "Sec-Fetch-Dest": "document",
    });

    const searchUrl = `https://www.barnesandnoble.com/s/${isbn}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 20000 });

    // Türelmesebben várjuk a dinamikus tartalmat
    await page
      .waitForSelector(".product-shelf-info, .current-price, .price, .product-list-item", { timeout: 12000 })
      .catch(() => {}); // Nem fatális, ha a selector nem jelenik meg

    const data = await page.evaluate(() => {
      // Próbáljuk a közvetlen termékoldalt első körben
      const directPrice = document.querySelector(".current-price, .sale-price, span[itemprop='price']");
      if (directPrice) {
        const link = document.querySelector("link[rel='canonical']");
        return {
          priceText: directPrice.innerText || directPrice.getAttribute("content"),
          link: link ? link.href : window.location.href,
        };
      }

      // Keresési eredmény lista
      const item = document.querySelector(".product-shelf-info, .product-item, .product-list-item");
      if (!item) return null;

      const priceElem = (item.closest?.(".product-shelf") || item).querySelector(
        ".current-price, .sale-price, .price, span[itemprop='price']"
      );
      const linkElem = item.querySelector("a.product-image-link, .product-info-title a, a[href*='/w/']");

      return {
        priceText: priceElem ? priceElem.innerText || priceElem.getAttribute("content") : null,
        link: linkElem ? linkElem.href : null,
      };
    });

    if (!data || !data.priceText) return null;

    const priceMatch = data.priceText.replace(/,/g, "").match(/\d+(\.\d+)?/);
    if (!priceMatch) return null;

    const price = parseFloat(priceMatch[0]);
    if (isNaN(price) || price === 0) return null;

    return {
      store: "Barnes & Noble",
      condition: "New",
      price,
      currency: "USD",
      buyUrl: data.link || searchUrl,
    };
  } catch (err) {
    console.error(`[BN Scraper] Error for ISBN ${isbn}:`, err.message);
    return null;
  } finally {
    if (browser) await browser.close();
  }
};
