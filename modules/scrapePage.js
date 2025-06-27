import { extractBookInfo } from './utils/extractBookInfo.js';
import { downloadImage } from './utils/downloadImage.js';
import { BASE_URLS } from './config/constants.js'


export const scrapePage = async (page, pageIndex, options = {}) => {
  await page.waitForSelector('.product_pod');

  const rawBooks = await page.$$eval('.product_pod', (items, base) => {
    return items.map(item => {
      const title = item.querySelector('h3 a')?.getAttribute('title') || '';
      const price = item.querySelector('.price_color')?.textContent || '';
      const availability = item.querySelector('.availability')?.textContent.trim() || '';
      const imageRel = item.querySelector('img')?.getAttribute('src') || '';
      const image = new URL(imageRel.replace(/^(\.\.\/)+/, ''), base).href;

      return { title, price, availability, image };
    });
  }, BASE_URLS.BOOKS);
  ;

  const books = rawBooks.map(book => extractBookInfo(book, { pageIndex }));

  console.log(`[DEBUG] Scraped ${books.length} books. Sample:`, books[0]);

  // ✅ Download images if path is provided
  if (options.assetsPath) {
    const assetFolder = options.assetsPath;

    for (const book of books) {
      if (book.image) {
        console.log(`[DEBUG] Downloading image: ${book.image}`);
        try {
          await downloadImage(book.image, assetFolder, book.title);
        } catch (err) {
          console.error(`Image download failed: ${err.message}`);
        }
      } else {
        console.warn(`[WARN] Book has no image:`, book.title);
      }
    }
  }

  return books;
};
