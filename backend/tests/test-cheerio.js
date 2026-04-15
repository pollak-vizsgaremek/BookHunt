import fs from 'fs';
import * as cheerio from 'cheerio';

const htmlLR = fs.readFileSync('libristo_dump.html', 'utf8');
const $LR = cheerio.load(htmlLR);
console.log('--- LIBRISTO DUMP --');
console.log('Links:', $LR('a').slice(0, 10).map((i, el) => $LR(el).attr('href')).get());
console.log('Prices:', $LR('div[class*="price"], span[class*="price"], p[class*="price"]').slice(0, 10).map((i, el) => $LR(el).attr('class') + ':' + $LR(el).text().trim()).get());

const htmlL = fs.readFileSync('libri_dump.html', 'utf8');
const $L = cheerio.load(htmlL);
console.log('--- LIBRI DUMP --');
console.log('Links:', $L('a').slice(0, 10).map((i, el) => $L(el).attr('href')).get());
console.log('Prices:', $L('.price, .price-holder, .online, .discount-price').slice(0, 10).map((i, el) => $L(el).attr('class') + ':' + $L(el).text().trim()).get());
