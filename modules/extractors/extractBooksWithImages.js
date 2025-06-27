
import { scrapeGenrePage } from './scrapeGenrePage.js';
import { BASE_URLS } from '../config/constants.js';
import { downloadImage } from '../utils/downloadImage.js';

/**
Image downloader using Node's https module
 */


/**
 * Downloads an image from a URL to the specified folder with a sanitized filename.
 */
export const extractBooksWithImages = async (page, options) => {
  const base = BASE_URLS.BOOKS;

  await page.goto(baseUrl);
  await page.waitForSelector('.side_categories');

  const genres = await page.$$eval('.side_categories ul li ul li a', links =>
    links.map(link => ({
      name: link.textContent.trim(),
      url: new URL(link.getAttribute('href'), base).href
    }))
  );

  const allBooks = [];

  for (const genre of genres) {
    console.log(`Genre: ${genre.name}`);
    let currentPage = 1;
    let hasNext = true;

    while (hasNext && (!options.limit || currentPage <= options.limit)) {
      const genrePageUrl =
        currentPage === 1
          ? genre.url
          : genre.url.replace('index.html', `page-${currentPage}.html`);

      try {
        await page.goto(genrePageUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.product_pod');

        const books = await scrapeGenrePage(page, genre.name);

        for (const book of books) {
          if (book.image && options.assetsPath) {
            await downloadImage(book.image, options.assetsPath, book.title);
          }
        }

        allBooks.push(...books);
        currentPage++;

        hasNext = await page.$('li.next a') !== null;
      } catch (err) {
        console.error(`Error on ${genrePageUrl}: ${err.message}`);
        break;
      }
    }
  }

  return allBooks;
};
