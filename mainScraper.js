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

puppeteer.use(StealthPlugin());

const argv = yargs(hideBin(process.argv))
    .option('target', {
        alias: 't',
        describe: 'Scraping target: books, genre, or images',
        choices: ['books', 'genre', 'images'],
        default: 'books'
    })
    .option('limit', {
        alias: 'l',
        describe: 'Max pages to scrape',
        type: 'number',
        default: 1
    })
    .option('genre-limit', {
        describe: 'Limit the number of genres to scrape',
        type: 'number'
    })
    .option('genres', {
        describe: 'Comma-separated list of genre names to scrape (e.g. "Romance,Fiction")',
        type: 'string'
    })
    .option('images', {
        describe: 'Enable downloading of book cover images',
        type: 'boolean',
        default: false
    })
    .option('delay', { alias: 'd', type: 'number', default: 1000 })
    .option('headless', { type: 'boolean', default: true })
    .option('output', { type: 'string' })
    .option('log', { type: 'string', default: 'scraper.log' })
    .option('max-retries', { type: 'number', default: 2 })
    .option('assets', {
        type: 'string',
        describe: 'changes the default folder that downloads go into',
        default: 'assets/'
    })
    .argv;

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
fs.mkdirSync(argv.assets, { recursive: true });
fs.mkdirSync(path.dirname(argv.output), { recursive: true });

setupLogger(argv.log);

const run = async () => {
    const start = logStart();
    const baseUrl = 'https://books.toscrape.com/';
    logInfo(`Starting to scrape target: "${argv.target}"`);
    logInfo(`Base URL: ${baseUrl}`);
    logInfo(`Output path: ${argv.output}`);

    const browser = await puppeteer.launch({ headless: argv.headless });
    const page = await browser.newPage();
    page.assetsPath = argv.assets;

    try {
        let results = [];

        if (argv.target === 'books') {
            results = await handlePagination(page, {
                baseUrl,
                delay: argv.delay,
                limit: argv.limit,
                genreLimit: argv['genre-limit'],
                maxRetries: argv['max-retries'],
                scrapeFn: scrapePage,
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
