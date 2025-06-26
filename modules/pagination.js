import { URL } from 'url';

/**
 * Handles paginated scraping for either main catalog or genre.
 */
export const handlePagination = async (page, {
  baseUrl,
  delay = 1000,
  limit = 3,
  maxRetries = 2,
  scrapeFn,
  onPageScraped = () => {}
}) => {
  const results = [];
  let pageIndex = 1;
  let hasNext = true;

  while (hasNext && (!limit || pageIndex <= limit)) {
    let pageUrl;

    // ✅ MAIN CATALOG (page 1 = index.html, page 2+ = /catalogue/page-X.html)
    if (baseUrl === 'https://books.toscrape.com/' || baseUrl.endsWith('/index.html')) {
      pageUrl =
        pageIndex === 1
          ? 'https://books.toscrape.com/index.html'
          : `https://books.toscrape.com/catalogue/page-${pageIndex}.html`;
    } else {
      // ✅ GENRE pages: e.g. travel_2/index.html → page-2.html
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

    // Check for next page
    hasNext = await page.$('li.next a') !== null;
    pageIndex++;

    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
;
  }

  return results;
};
