import { launchStealthBrowser, configurePage, emulateHumanBehavior, emulateHumanScrolling, detectBotBlock } from '../utils/browserUtils.js';

export const scrapeThriftBooks = async (isbn, signal) => {
  let browser = null;

  const onAbort = async () => {
    if (browser) await browser.close();
  };

  if (signal) {
    if (signal.aborted) throw new Error("Aborted");
    signal.addEventListener("abort", onAbort, { once: true });
  }

  try {
    browser = await launchStealthBrowser();
    const page = await browser.newPage();
    await configurePage(page, 'ThriftBooks');

    await emulateHumanBehavior(page, 'ThriftBooks');

    const searchUrl = `https://www.thriftbooks.com/browse/?b.search=${isbn}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 12000 });

    detectBotBlock(await page.title(), 'ThriftBooks');

    await page
      .waitForSelector(".SearchResultGridItem, .AllEditionsItem, .book-price", { timeout: 12000 })
      .catch(() => {});

    await emulateHumanScrolling(page, 'ThriftBooks');

    const data = await page.evaluate(() => {
      const directPrice = document.querySelector(".book-price .price, .UsedPriceBlock-price");
      if (directPrice) {
        return { priceText: directPrice.innerText, link: window.location.href };
      }

      const results = Array.from(document.querySelectorAll(".SearchResultGridItem, .AllEditionsItem"));
      const targetResult = results[0];

      if (!targetResult) return null;

      const priceElem = targetResult.querySelector(".SearchResultListItem-price, .AllEditionsItem-price");
      let link = window.location.href;
      const linkElem = targetResult.querySelector("a");
      if (linkElem && linkElem.href) {
        link = linkElem.href;
      }
      return { priceText: priceElem ? priceElem.innerText : "", link };
    });

    if (!data || !data.priceText) return null;

    const { priceText, link } = data;
    const numMatch = priceText.match(/[\d.]+/);
    if (!numMatch) return null;

    const price = parseFloat(numMatch[0]);
    if (isNaN(price) || price === 0) return null;

    return {
      store: "ThriftBooks",
      condition: "Used",
      price: price,
      currency: "USD",
      buyUrl: link,
    };
  } catch (err) {
    if (signal?.aborted) throw new Error(`ThriftBooks scraper aborted for ISBN ${isbn}`);
    throw new Error(`ThriftBooks scraper error for ISBN ${isbn}: ${err.message}`);
  } finally {
    if (signal) signal.removeEventListener("abort", onAbort);
    if (browser) await browser.close();
  }
};
