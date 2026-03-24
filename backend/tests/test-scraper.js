import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function test() {
  const isbn = '9789634065222';
  try {
    const libriRobots = await axios.get('https://www.libri.hu/robots.txt');
    console.log('--- libri.hu robots.txt ---');
    console.log(libriRobots.data.split('\n').filter(l => l.includes('Disallow:') && l.includes('/konyv')).join('\n'));
    console.log('----------------------------\n');

    const booklineRobots = await axios.get('https://bookline.hu/robots.txt');
    console.log('--- bookline.hu robots.txt ---');
    console.log(booklineRobots.data.split('\n').filter(l => l.includes('Disallow:') && l.includes('/product')).join('\n'));
    console.log('----------------------------\n');

    const libriRes = await axios.get(`https://www.libri.hu/konyv/isbn/${isbn}.html`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' }
    });
    fs.writeFileSync('libri-test.html', libriRes.data);
    
    // Find price in Libri HTML
    const $libri = cheerio.load(libriRes.data);
    const libriPrice1 = $libri('.price').text().trim();
    const libriPrice2 = $libri('div[class*="price"]').text().trim();
    console.log('Libri potential prices:', { libriPrice1, libriPrice2 });

    const booklineRes = await axios.get(`https://bookline.hu/product/home/${isbn}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36' }
    });
    fs.writeFileSync('bookline-test.html', booklineRes.data);
    
    // Find price in Bookline HTML
    const $bookline = cheerio.load(booklineRes.data);
    const booklinePrice1 = $bookline('.price').text().trim();
    const booklinePrice2 = $bookline('div[class*="price"]').text().trim();
    console.log('Bookline potential prices:', { booklinePrice1, booklinePrice2 });

  } catch (error) {
    console.error('Error:', error.message);
    if(error.response) console.error(error.response.status);
  }
}

test();
