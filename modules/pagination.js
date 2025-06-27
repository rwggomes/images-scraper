import { BASE_URLS, SCRAPING_DELAYS } from './config/constants.js';

/**
 * Handles paginated scraping for either the main catalog or a genre page.
 */
export const handlePagination = async (
  page,
  {
    baseUrl,
    delay = SCRAPING_DELAYS.DEFAULT_PAGE_DELAY,
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

    if (baseUrl === BASE_URLS.BOOKS || baseUrl.endsWith('/index.html')) {
      pageUrl =
        pageIndex === 1
          ? `${BASE_URLS.BOOKS}index.html`
          : `${BASE_URLS.BOOKS}catalogue/page-${pageIndex}.html`;
    } else {
      pageUrl =
        pageIndex === 1
          ? baseUrl
          : baseUrl.replace('index.html', `page-${pageIndex}.html`);
    }

    let retryCount = 0;
    let success = false;

    // Retry failed page loads up to the configured maxRetries value
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

        // Wait between retries to avoid hammering the server (defined in SCRAPING_DELAYS)
        await new Promise(resolve => setTimeout(resolve, SCRAPING_DELAYS.RETRY_DELAY));
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
