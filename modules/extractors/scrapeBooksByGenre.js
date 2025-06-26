import fs from 'fs';
import path from 'path';
import https from 'https';
import { scrapeGenrePage } from './scrapeGenrePage.js';

export const scrapeBooksByGenre = async (page, options) => {
    const baseUrl = 'https://books.toscrape.com/';
    await page.goto(baseUrl);
    await page.waitForSelector('.side_categories');

    const genres = await page.$$eval('.side_categories ul li ul li a', links =>
        links.map(link => ({
            name: link.textContent.trim(),
            url: new URL(link.getAttribute('href'), 'https://books.toscrape.com/').href
        }))
    );


    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
    const isSpecificGenreRun = !!options.genres;
    const baseOutputFolder = path.join(
        'output',
        isSpecificGenreRun
            ? `selectedGenres-${timestamp}`
            : `allGenres-${timestamp}`
    );


    // Inlined image downloader (still used)
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
                        reject(new Error(`Request failed: ${response.statusCode}`));
                        return;
                    }

                    response.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve();
                    });
                }).on('error', (err) => {
                    fs.unlink(fullPath, () => { });
                    reject(new Error(`Error downloading ${url}: ${err.message}`));
                });
            } catch (err) {
                reject(new Error(`Unexpected error: ${err.message}`));
            }
        });
    };

    // Filter & limit genres
    const genreFilterList = options.genres
        ? options.genres.split(',').map(name => name.trim().toLowerCase())
        : null;

    const filteredGenres = genreFilterList
        ? genres.filter(g => genreFilterList.includes(g.name.toLowerCase()))
        : genres;

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
            const url = genre.url.replace('index.html', `page-${pageNum}.html`);
            const finalUrl = pageNum === 1 ? genre.url : url;

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
                                console.error(err.message);
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
            const genreDir = path.join(
                baseOutputFolder,
                genre.name.replace(/\s+/g, '_')
            );
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
