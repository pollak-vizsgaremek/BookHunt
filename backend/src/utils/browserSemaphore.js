/**
 * browserSemaphore.js
 *
 * Limits concurrent Puppeteer browser launches to prevent RAM exhaustion and
 * Chromium process spawn failures when multiple scrapers run in parallel.
 *
 * Each headless Chromium instance consumes 150–300 MB of RAM. Launching 5–6
 * simultaneously (as the orchestrator does) saturates memory on typical dev
 * machines and VPS instances, causing the browser process to fail to start.
 *
 * MAX_CONCURRENT_BROWSERS = 2 means at most 2 Chromium processes are alive
 * at any given time; the rest queue and wait for a slot to become free.
 */

const MAX_CONCURRENT_BROWSERS = 2;

let running = 0;

/** @type {Array<() => void>} */
const queue = [];

/**
 * Acquires a browser slot. Resolves immediately if a slot is free,
 * otherwise waits until one is released.
 */
export async function acquireBrowserSlot() {
  if (running < MAX_CONCURRENT_BROWSERS) {
    running++;
    return;
  }
  await new Promise(resolve => queue.push(resolve));
  running++;
}

/**
 * Releases a browser slot. Must be called in the scraper's `finally` block
 * after `browser.close()`.
 */
export function releaseBrowserSlot() {
  running = Math.max(0, running - 1);
  if (queue.length > 0) {
    const next = queue.shift();
    next();
  }
}
