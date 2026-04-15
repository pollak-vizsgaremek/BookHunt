import { runScrapers } from '../../src/services/scraperOrchestrator.js';
import * as dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const originalWarn = console.warn;
const warnings = [];
console.warn = (...args) => {
  warnings.push(args.join(' '));
  originalWarn(...args);
};

console.log('Testing scraper orchestrator for DC vs Vampires (9781779519375)...');
runScrapers({ isbn: '9781779519375', isManga: false, isComic: true })
  .then(res => {
    fs.writeFileSync('test-results.json', JSON.stringify({ offers: res, warnings: warnings }, null, 2));
    console.log('Done! See test-results.json');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal orchestrator error:', err);
    process.exit(1);
  });
