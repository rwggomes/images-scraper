import { extractBookInfo } from '../utils/extractBookInfo.js';
import { BASE_URLS } from '../config/constants.js';

export const scrapeGenrePage = async (page, genre) => {
  await page.waitForSelector('.product_pod');

  const rawBooks = await page.$$eval('.product_pod', (items, BASE) => {
    return items.map(item => {
      const title = item.querySelector('h3 a')?.getAttribute('title') || '';
      const price = item.querySelector('.price_color')?.textContent || '';
      const availability = item.querySelector('.availability')?.textContent.trim() || '';

      let image = '';
      const imgEl = item.querySelector('img');
      if (imgEl) {
        const imageRel = imgEl.getAttribute('src');
        if (imageRel && typeof imageRel === 'string') {
          try {
            const cleanedPath = imageRel.replace(/^(\.\.\/)+/, '');
            image = new URL(cleanedPath, BASE).href;
          } catch (e) {
            console.warn('Invalid image URL:', imageRel);
          }
        }
      }

      return { title, price, availability, image };
    });
  }, BASE_URLS.BOOKS); // ✅ safely passed to browser context

  return rawBooks.map(book => extractBookInfo(book, { genre }));
};
