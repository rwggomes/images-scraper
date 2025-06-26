import fs from 'fs';
import path from 'path';
import https from 'https';
import { scrapeGenrePage } from './scrapeGenrePage.js';

/**
 * Inlined image downloader using Node's https module
 */
const downloadImage = (url, folder, title) => {
  return new Promise((resolve, reject) => {
    try {
      const ext = path.extname(url).split('?')[0] || '.jpg';
      const safeTitle = title.replace(/[\/:*?"<>|]/g, '').substring(0, 50);
      const filename = `${safeTitle}${ext}`;
      const fullPath = path.join(folder, filename);

      fs.mkdirSync(folder, { recursive: true });

      const file = fs.createWriteStream(fullPath);
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Request failed with status: ${response.statusCode}`));
          return;
        }

        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`Downloaded: ${filename}`);
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(fullPath, () => { }); // Clean up failed file
        reject(new Error(`Error downloading ${url}: ${err.message}`));
      });
    } catch (err) {
      reject(new Error(`Unexpected error: ${err.message}`));
    }
  });
};

export const extractBooksWithImages = async (page, options) => {
  const baseUrl = 'https://books.toscrape.com/';
  await page.goto(baseUrl);
  await page.waitForSelector('.side_categories');

  const genres = await page.$$eval('.side_categories ul li ul li a', links =>
    links.map(link => ({
      name: link.textContent.trim(),
      url: new URL(link.getAttribute('href'), baseUrl).href
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
