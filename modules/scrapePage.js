export const scrapePage = async (page, pageIndex) => {
  await page.waitForSelector('.product_pod');

  return await page.$$eval(
    '.product_pod',
    (books, index) => {
      return books.map(book => {
        const title = book.querySelector('h3 a')?.getAttribute('title') || '';
        const price = book.querySelector('.price_color')?.textContent || '';
        const availability = book.querySelector('.availability')?.textContent.trim() || '';
        const image = book.querySelector('img')?.getAttribute('src') || '';
        return { title, price, availability, image, pageIndex: index };
      });
    },
    pageIndex // Pass pageIndex as argument to $$eval
  );
};
