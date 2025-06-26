import { URL } from 'url';

/**
 * Handles paginated scraping for either the main catalog or a genre page.
 * 
 * @param {puppeteer.Page} page - Puppeteer page instance
 * @param {object} options
 * @param {string} options.baseUrl - Base URL of the scraping target
 * @param {number} options.delay - Millisecond delay between pages
 * @param {number} options.limit - Max number of pages to scrape
 * @param {number} options.maxRetries - Max retry attempts per page
 * @param {Function} options.scrapeFn - Function that performs the scraping
 * @param {Function} options.onPageScraped - Optional callback after each page
 * @returns {Promise<Array>} - Collected results
 */
export const handlePagination = async (
  page,
  {
    baseUrl,
    delay = 1000,
    limit = 3,
    maxRetries = 2,
    scrapeFn,
    onPageScraped = () => {}
  }
) => {
  const results = [];
  let pageIndex = 1;
  let hasNext = true;

  while (hasNext && (!limit || pageIndex <= limit)) {
    let pageUrl;

    // Main catalog logic
    if (baseUrl === 'https://books.toscrape.com/' || baseUrl.endsWith('/index.html')) {
      pageUrl =
        pageIndex === 1
          ? 'https://books.toscrape.com/index.html'
          : `https://books.toscrape.com/catalogue/page-${pageIndex}.html`;
    } else {
      // Genre-specific pagination
      pageUrl =
        pageIndex === 1
          ? baseUrl
          : baseUrl.replace('index.html', `page-${pageIndex}.html`);
    }

    let retryCount = 0;
    let success = false;

    while (!success && retryCount <= maxRetries) {
      try {
        await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.product_pod');

        const data = await scrapeFn(page, pageIndex);
        results.push(...data);

        onPageScraped(pageIndex);
        success = true;
      } catch (err) {
        retryCount++;
        console.error(`Retry ${retryCount}/${maxRetries} failed on ${pageUrl}: ${err.message}`);
      }
    }

    if (!success) {
      console.warn(`Skipping ${pageUrl} after ${maxRetries} retries.`);
    }

    hasNext = await page.$('li.next a') !== null;
    pageIndex++;

    if (delay) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return results;
};
