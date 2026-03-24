import axios from "axios";

/**
 * Fetches the live exchange rate from USD to HUF
 * using the free Frankfurter API (no API key needed).
 * Data source: European Central Bank (ECB)
 *
 * @returns {Promise<number>} The USD → HUF exchange rate
 */
export async function getUsdToHufRate() {
  const response = await axios.get("https://api.frankfurter.app/latest", {
    params: { from: "USD", to: "HUF" },
    timeout: 5000
  });
  return response.data.rates.HUF;
}

/**
 * Fetches the live exchange rate from EUR to HUF
 * using the free Frankfurter API.
 *
 * @returns {Promise<number>} The EUR → HUF exchange rate
 */
export async function getEurToHufRate() {
  const response = await axios.get("https://api.frankfurter.app/latest", {
    params: { from: "EUR", to: "HUF" },
    timeout: 5000
  });
  return response.data.rates.HUF;
}

/**
 * Converts a USD amount to HUF using a given exchange rate.
 * Returns null if the input is not a valid number.
 *
 * @param {number|null} usdAmount - The price in USD
 * @param {number} rate - The USD → HUF exchange rate
 * @returns {number|null} The price in HUF, rounded to the nearest forint
 */
export function convertToHuf(usdAmount, rate) {
  if (usdAmount == null || isNaN(usdAmount)) return null;
  return Math.round(usdAmount * rate);
}
