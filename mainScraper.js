import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs';
import path from 'path';

import { scrapeBooksByGenre } from './modules/extractors/scrapeBooksByGenre.js';
import { extractBooksWithImages } from './modules/extractors/extractBooksWithImages.js';
import { scrapePage } from './modules/scrapePage.js';
import { handlePagination } from './modules/pagination.js';
import { saveResults } from './modules/save.js';
import { setupLogger, logStart, logEnd, logInfo, logError } from './modules/logger.js';
import { SCRAPING_DELAYS, BASE_URLS } from './modules/config/constants.js';
import { CLI_OPTIONS } from './modules/config/cli.js';

puppeteer.use(StealthPlugin());

const argv = yargs(hideBin(process.argv))
  .options({
    target: CLI_OPTIONS.TARGET,
    limit: CLI_OPTIONS.LIMIT,
    'genre-limit': CLI_OPTIONS.GENRE_LIMIT,
    genres: CLI_OPTIONS.GENRES,
    images: CLI_OPTIONS.IMAGES,
    delay: CLI_OPTIONS.DELAY,
    headless: CLI_OPTIONS.HEADLESS,
    output: CLI_OPTIONS.OUTPUT,
    log: CLI_OPTIONS.LOG,
    'max-retries': CLI_OPTIONS.MAX_RETRIES,
    assets: CLI_OPTIONS.ASSETS
  })
  .check((argv) => {
    const { LIMIT, MAX_RETRIES } = CLI_OPTIONS;

    if (argv.limit < LIMIT.min || argv.limit > LIMIT.max) {
      const suggested = Math.max(LIMIT.min, Math.min(argv.limit, LIMIT.max));
      throw new Error(
        `Invalid --limit: ${argv.limit}. Must be between ${LIMIT.min} and ${LIMIT.max}. ` +
        `Did you mean --limit ${suggested}?`
      );
    }

    if (argv['max-retries'] < MAX_RETRIES.min || argv['max-retries'] > MAX_RETRIES.max) {
      const suggested = Math.max(MAX_RETRIES.min, Math.min(argv['max-retries'], MAX_RETRIES.max));
      throw new Error(
        `Invalid --max-retries: ${argv['max-retries']}. Must be between ${MAX_RETRIES.min} and ${MAX_RETRIES.max}. ` +
        `Did you mean --max-retries ${suggested}?`
      );
    }

    return true;
  })
  .argv;


if (argv.limit < 1) throw new Error("Limit must be >= 1");
if (argv['max-retries'] < 0 || argv['max-retries'] > 10) throw new Error("Retries must be between 0–10");

// Automatically switch to genre target if --genres is specified and --target is not
if (!hideBin(process.argv).some(arg => arg.startsWith('--target')) && argv.genres && argv.target === 'books') {
  argv.target = 'genre';
}

// Setup timestamped asset directory
const runTimestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
const isSpecificGenreRun = !!argv.genres;
const assetRunLabel = isSpecificGenreRun ? 'selectedGenres' : 'allGenres';
argv.assets = path.join(argv.assets, `${assetRunLabel}-${runTimestamp}`);

// Ensure output & asset directories exist
if (!argv.output) {
  argv.output = `output/${argv.target}.json`;
}
fs.mkdirSync(path.dirname(argv.output), { recursive: true });

// Only create asset folder if --images is true
if (argv.images) {
  fs.mkdirSync(argv.assets, { recursive: true });
}

setupLogger(argv.log);

const run = async () => {
  const start = logStart();
  logInfo(`Starting to scrape target: "${argv.target}"`);
  logInfo(`Base URL: ${BASE_URLS.BOOKS}`);
  logInfo(`Output path: ${argv.output}`);

  const browser = await puppeteer.launch({ headless: argv.headless });
  const page = await browser.newPage();
  page.assetsPath = argv.assets;

  try {
    let results = [];

    if (argv.target === 'books') {
      results = await handlePagination(page, {
        baseUrl: BASE_URLS.BOOKS,
        delay: argv.delay,
        limit: argv.limit,
        genreLimit: argv['genre-limit'],
        maxRetries: argv['max-retries'],
        scrapeFn: (page, i) => scrapePage(page, i, {
          assetsPath: argv.images ? argv.assets : null
        }),
        onPageScraped: (i) => logInfo(`Scraped main catalog page ${i}`)
      });
    } else if (argv.target === 'genre') {
      results = await scrapeBooksByGenre(page, {
        delay: argv.delay,
        limit: argv.limit,
        genres: argv.genres,
        genreLimit: argv['genre-limit'],
        assetsPath: argv.images ? argv.assets : null,
        maxRetries: argv['max-retries'],
        savePerGenre: true,
        onGenreScraped: (genre, count) =>
          logInfo(`Scraped ${count} books from genre "${genre}"`)
      });
    } else if (argv.target === 'images') {
      results = await extractBooksWithImages(page, {
        delay: argv.delay,
        limit: argv.limit,
        assetsPath: argv.assets
      });
    } else {
      throw new Error(`Unsupported target: ${argv.target}`);
    }

    await saveResults(results, 'json', '', argv.target, argv);
    logInfo(`Scraping complete. Total records: ${results.length}`);
  } catch (err) {
    logError(`Fatal error: ${err.message}`);
  } finally {
    await browser.close();
    logEnd(start);
  }
};

run();
