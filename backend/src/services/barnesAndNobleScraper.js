import { launchStealthBrowser, configurePage, emulateHumanBehavior, emulateHumanScrolling, detectBotBlock } from '../utils/browserUtils.js';

export const scrapeBarnesAndNoble = async (isbn, signal) => {
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
    await configurePage(page, 'B&N');

    await emulateHumanBehavior(page, 'B&N');

    const searchUrl = `https://www.barnesandnoble.com/s/${isbn}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 12000 });

    detectBotBlock(await page.title(), 'Barnes & Noble');

    await page
      .waitForSelector(".product-shelf-info, .current-price, .price, .product-list-item", { timeout: 12000 })
      .catch(() => {});

    await emulateHumanScrolling(page, 'B&N');

    const data = await page.evaluate(() => {
      const directPrice = document.querySelector(".current-price, .sale-price, span[itemprop='price']");
      if (directPrice) {
        return { priceText: directPrice.innerText, link: window.location.href };
      }

      const results = Array.from(document.querySelectorAll(".product-shelf-info, .product-list-item"));
      const targetResult = results.find((el) => {
        const text = el.innerText.replace(/-/g, "");
        return text.includes(isbn);
      }) || results[0];

      if (!targetResult) return null;

      const priceElem = targetResult.querySelector(".current-price, .price");
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
      store: "BarnesAndNoble",
      condition: "New",
      price: price,
      currency: "USD",
      buyUrl: link,
    };
  } catch (err) {
    if (signal?.aborted) throw new Error(`BarnesAndNoble scraper aborted for ISBN ${isbn}`);
    throw new Error(`BarnesAndNoble scraper error for ISBN ${isbn}: ${err.message}`);
  } finally {
    if (signal) signal.removeEventListener("abort", onAbort);
    if (browser) await browser.close();
  }
};
