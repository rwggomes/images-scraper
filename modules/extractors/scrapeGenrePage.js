/**
 * Scrapes book data from a genre page.
 * 
 * @param {puppeteer.Page} page - The Puppeteer page instance.
 * @param {string} genre - The genre name to associate with each book entry.
 * @returns {Promise<Array>} - List of books with metadata including genre.
 */
export const scrapeGenrePage = async (page, genre) => {
  return await page.$$eval('.product_pod', (items, genreName) => {
    return items.map(item => {
      const title = item.querySelector('h3 a')?.getAttribute('title') || '';
      const price = item.querySelector('.price_color')?.textContent || '';
      const availability = item.querySelector('.availability')?.textContent.trim() || '';
      const imageRel = item.querySelector('img')?.getAttribute('src') || '';
      const image = new URL(imageRel.replace('../../', ''), 'https://books.toscrape.com/').href;

      return { title, price, availability, image, genre: genreName };
    });
  }, genre);
};
