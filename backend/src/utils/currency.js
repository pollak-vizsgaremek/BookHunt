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
 * Converts a currency amount to HUF using a given exchange rate.
 * Returns 0 if the input is not a valid number.
 *
 * @param {number|null} amount - The price in original currency
 * @param {number} rate - The exchange rate (e.g., USD → HUF)
 * @returns {number} The price in HUF, rounded to the nearest forint
 */
export function convertToHuf(amount, rate) {
  if (amount == null || isNaN(amount)) return 0;
  return Math.round(amount * rate);
}
