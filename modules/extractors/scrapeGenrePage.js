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
  }, genre); // 👈 Pass genre as argument to $$eval
};
