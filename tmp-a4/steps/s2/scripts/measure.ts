/**
 * Measures one page and prints what it downloaded.
 *
 *   npm run measure -- https://en.wikipedia.org/wiki/Main_Page
 */
import { chromium } from 'playwright';
import { measurePage, type LoadStats } from '../src/measure';

const url = process.argv[2];
if (!url) {
  console.error('Usage: npm run measure -- <url>');
  process.exit(1);
}

const browser = await chromium.launch();
const result = await measurePage(browser, url);
await browser.close();

if (result.error || !result.cold) {
  console.error(`Couldn't measure ${url}: ${result.error}`);
  process.exit(2);
}

const size = (bytes: number) => (bytes < 10_000 ? `${(bytes / 1e3).toFixed(1)} KB` : `${(bytes / 1e6).toFixed(2)} MB`);
const byType = (stats: LoadStats) =>
  Object.entries(stats.byType)
    .filter(([, bytes]) => bytes > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([type, bytes]) => `  ${type.padEnd(14)}${size(bytes).padStart(9)}`)
    .join('\n');

console.log(`${result.finalUrl} (${result.status}, "${result.title}")`);
if (result.blocked) console.log("This looks like a bot wall or an error page, not the real thing.");
console.log(`\nfirst visit    ${size(result.cold.bytes)} in ${result.cold.requests} requests`);
console.log(byType(result.cold));
