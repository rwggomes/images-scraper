export const BASE_URLS = {
  BOOKS: 'https://books.toscrape.com/'
};

export const FILE_LIMITS = {
  MAX_FILENAME_LENGTH: 50, // Reduced for cross-platform compatibility
  SAFE_FILENAME_LENGTH: 100, // More reasonable limit
  MAX_PATH_LENGTH: 255 // Most filesystem limit
};

export const SCRAPING_DELAYS = {
  DEFAULT_PAGE_DELAY: 1000, // 1 second between pages to be respectful
  RETRY_DELAY: 500, // 0.5 second between retries
  RATE_LIMIT_DELAY: 2000 // 2 seconds if rate limited
};
