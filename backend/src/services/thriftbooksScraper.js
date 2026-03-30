/**
 * thriftbooksScraper.js  (Stealth Edition)
 *
 * Probléma az eredetivel: ThriftBooks aktív bot-detektálást alkalmaz
 * (Cloudflare-szerű védelem), ami blokkolja a sima headless Chrome-ot.
 *
 * Megoldás: puppeteer-extra + puppeteer-extra-plugin-stealth
 *   – webdriver property maszkolt
 *   – Reális böngésző fingerprint
 *   – Randomizált User-Agent
 */

import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

// Stealth plugin regisztrálása (idempotens — többszöri use() nem okoz problémát)
puppeteerExtra.use(StealthPlugin());

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.86 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
];

const getRandomUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

export const scrapeThriftBooks = async (isbn) => {
  let browser = null;
  try {
    browser = await puppeteerExtra.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--window-size=1440,900",
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent(getRandomUA());

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

    const searchUrl = `https://www.thriftbooks.com/browse/?b.search=${isbn}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 20000 });

    // ThriftBooks React SPA — extra idő a renderelésre
    await page
      .waitForSelector(".SearchResultGridItem, .AllEditionsItem, .book-price", { timeout: 12000 })
      .catch(() => {});

    const data = await page.evaluate(() => {
      // Próbáljuk meg a direkt termékoldalt (ha az ISBN egyenesen átirányít)
      const directPrice = document.querySelector(
        ".WorkMeta-price, .price-tag, [data-test='book-price'], .AllEditionsList .AllEditionsItem-price"
      );
      if (directPrice) {
        const canonical = document.querySelector("link[rel='canonical']");
        return {
          priceText: directPrice.innerText,
          link: canonical ? canonical.href : window.location.href,
        };
      }

      // Keresési találati oldal
      const item = document.querySelector(
        ".SearchResultGridItem, .AllEditionsItem, .product-item, .SearchResultListItem"
      );
      if (!item) return null;

      const priceElem = item.querySelector(
        ".SearchResultGridItemPrice-price, .AllEditionsItem-price, .price, .book-price, .text-price"
      );
      const linkElem = item.querySelector(
        "a.SearchResultGridItem-link, .SearchResultGridItem-title a, a[href^='/w/'], a.SearchResultTileItem-title"
      );

      return {
        priceText: priceElem ? priceElem.innerText : null,
        link: linkElem ? linkElem.href : null,
      };
    });

    if (!data || !data.priceText) return null;

    // USD formátum: "$12.99" → 12.99
    const priceMatch = data.priceText.replace(/,/g, "").match(/\d+(\.\d+)?/);
    if (!priceMatch) return null;

    const price = parseFloat(priceMatch[0]);
    if (isNaN(price) || price === 0) return null;

    return {
      store: "ThriftBooks",
      condition: "Used",
      price,
      currency: "USD",
      buyUrl: data.link || searchUrl,
    };
  } catch (err) {
    console.error(`[ThriftBooks Scraper] Error for ISBN ${isbn}:`, err.message);
    return null;
  } finally {
    if (browser) await browser.close();
  }
};
