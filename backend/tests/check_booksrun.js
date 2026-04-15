import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const isbn = '9788074849589';
const key = process.env.BOOKSRUN_API_KEY;

async function checkBooksRun() {
  try {
    const url = `https://booksrun.com/api/v3/price/buy/${isbn}?key=${key}`;
    // Mask the API key in log output to prevent clear-text secret exposure
    const maskedKey = key ? `${key.substring(0, 4)}${'*'.repeat(Math.max(0, key.length - 4))}` : '[not set]';
    const displayUrl = `https://booksrun.com/api/v3/price/buy/${isbn}?key=${maskedKey}`;
    console.log(`Fetching from: ${displayUrl}`);
    const response = await axios.get(url);
    console.log('BooksRun Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('BooksRun Error:', error.message);
  }
}

checkBooksRun();
