import { SCRAPING_DELAYS, FILE_LIMITS } from './constants.js';

export const CLI_OPTIONS = {
    TARGET: {
        alias: 't',
        describe: 'Scraping target: books, genre, or images',
        choices: ['books', 'genre', 'images'],
        default: 'books'
    },
    LIMIT: {
        alias: 'l',
        describe: 'Max pages to scrape',
        type: 'number',
        default: 1,
        min: 1,
        max: 50
    },
    GENRE_LIMIT: {
        describe: 'Limit the number of genres to scrape',
        type: 'number'
    },
    GENRES: {
        describe: 'Comma-separated list of genre names (e.g. "Romance,Fiction")',
        type: 'string'
    },
    IMAGES: {
        describe: 'Enable downloading of book cover images',
        type: 'boolean',
        default: false
    },
    DELAY: {
        alias: 'd',
        type: 'number',
        describe: 'Delay between page loads (ms)',
        default: SCRAPING_DELAYS.DEFAULT_PAGE_DELAY
    },
    HEADLESS: {
        type: 'boolean',
        default: true
    },
    OUTPUT: {
        type: 'string',
        describe: `Output filename. Max: ${FILE_LIMITS.MAX_PATH_LENGTH} characters`
    },
    LOG: {
        type: 'string',
        default: 'scraper.log'
    },
    MAX_RETRIES: {
        type: 'number',
        describe: 'Max retry attempts per page',
        default: 2,
        min: 0,
        max: 10
    },
    ASSETS: {
        type: 'string',
        describe: 'Directory to save downloaded images',
        default: 'assets/'
    }
};
