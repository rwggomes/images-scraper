import fs from 'fs';
import path from 'path';
import { scrapeGenrePage } from './scrapeGenrePage.js';
import { validateGenres } from '../utils/validateInput.js';
import { downloadImage } from '../utils/downloadImage.js';
import { BASE_URLS } from '../config/constants.js';

export const scrapeBooksByGenre = async (page, options) => {
  const baseUrl = BASE_URLS.BOOKS;
  await page.goto(baseUrl);
  await page.waitForSelector('.side_categories');

  const genres = await page.$$eval('.side_categories ul li ul li a', (links, base) => {
    return links.map(link => ({
      name: link.textContent.trim(),
      url: new URL(link.getAttribute('href'), base).href
    }));
  }, baseUrl);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const isSpecificGenreRun = !!options.genres;
  const baseOutputFolder = path.join(
    'output',
    isSpecificGenreRun ? `selectedGenres-${timestamp}` : `allGenres-${timestamp}`
  );

  // Validate genres
  let filteredGenres = genres;
  if (options.genres) {
    const genreFilterList = options.genres.split(',').map(name => name.trim());
    const validGenres = validateGenres(genreFilterList, genres.map(g => g.name));

    if (validGenres.length === 0) {
      throw new Error(`Invalid genres: ${options.genres}`);
    }

    filteredGenres = genres.filter(g => validGenres.includes(g.name));
  }

  const limitedGenres = options.genreLimit
    ? filteredGenres.slice(0, options.genreLimit)
    : filteredGenres;

  const allResults = [];

  for (const genre of limitedGenres) {
    console.log(`Scraping genre: ${genre.name}`);
    const genreResults = [];

    let pageNum = 1;
    let hasNext = true;

    while (hasNext && (!options.limit || pageNum <= options.limit)) {
      const finalUrl =
        pageNum === 1
          ? genre.url
          : genre.url.replace('index.html', `page-${pageNum}.html`);

      try {
        await page.goto(finalUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.product_pod');

        const books = await scrapeGenrePage(page, genre.name);

        if (options.assetsPath) {
          const genreFolder = path.join(options.assetsPath, genre.name.replace(/\s+/g, '_'));

          for (const book of books) {
            if (book.image) {
              try {
                await downloadImage(book.image, genreFolder, book.title);
              } catch (err) {
                console.error(`Image download error: ${err.message}`);
              }
            }
          }
        }

        genreResults.push(...books);
        pageNum++;
        hasNext = await page.$('li.next a') !== null;
      } catch (err) {
        console.error(`Failed to scrape ${finalUrl}: ${err.message}`);
        break;
      }
    }

    allResults.push(...genreResults);

    if (options.savePerGenre && genreResults.length > 0) {
      const genreDir = path.join(baseOutputFolder, genre.name.replace(/\s+/g, '_'));
      const filePath = path.join(
        genreDir,
        `${genre.name.replace(/\s+/g, '_')}-${timestamp}.json`
      );

      fs.mkdirSync(genreDir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(genreResults, null, 2));
      console.log(`Saved ${genreResults.length} books to ${filePath}`);
    }

    if (typeof options.onGenreScraped === 'function') {
      options.onGenreScraped(genre.name, genreResults.length);
    }
  }

  return allResults;
};
