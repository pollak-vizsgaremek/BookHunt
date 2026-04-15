import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const isbn = '9788074849589';
const key = process.env.BOOKSRUN_API_KEY;

async function checkBooksRun() {
  try {
    const url = `https://booksrun.com/api/v3/price/buy/${isbn}?key=${key}`;
    // Completely remove the API key from log output to prevent clear-text secret exposure
    // CodeQL flags any derived string (even substring) as tainted, so we use a constant string
    const displayUrl = `https://booksrun.com/api/v3/price/buy/${isbn}?key=[REDACTED]`;
    console.log(`Fetching from: ${displayUrl}`);
    const response = await axios.get(url);
    console.log('BooksRun Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('BooksRun Error:', error.message);
  }
}

checkBooksRun();
