````markdown
# Books Scraper

A modular, headless Puppeteer scraper for [books.toscrape.com](https://books.toscrape.com/), built with:

- Pagination support
- Targeted genre scraping
- Image downloading
- CLI support with smart behavior
- Modular architecture with reusable extractors

---

## Getting Started ## 

```bash
git clone https://github.com/your-username/books-scraper
cd books-scraper
npm install
````

---

## Usage ## 

Run the scraper using:

```bash
node mainScraper.js [options]
```

---

## CLI Options and Description

| Option           | Type    | Default                | Description                                                                                         |
| ---------------- | ------- | ---------------------- | --------------------------------------------------------------------------------------------------- |
| `--target`, `-t` | string  | `'books'`              | Scraping target: `books`, `genre`, or `images`                                                      |
| `--genres`       | string  | *undefined*            | Comma-separated genre names. If set without `--target`, it **automatically sets target to `genre`** |
| `--images`       | boolean | `false`                | Enable image downloading (cover art)                                                                |
| `--limit`, `-l`  | number  | `1`                    | Max number of pages to scrape                                                                       |
| `--genre-limit`  | number  | *undefined*            | Max number of genres to process                                                                     |
| `--delay`, `-d`  | number  | `1000`                 | Delay in milliseconds between pages                                                                 |
| `--headless`     | boolean | `true`                 | Run browser in headless mode                                                                        |
| `--output`       | string  | `output/<target>.json` | Output path override                                                                                |
| `--log`          | string  | `scraper.log`          | Log file path                                                                                       |
| `--max-retries`  | number  | `2`                    | Number of retry attempts per page                                                                   |
| `--assets`       | string  | `'assets/'`            | Output folder for images                                                                            |

---

## CLI Logic Behavior ## 

### 1. **Default Behavior**

Running:

```bash
node mainScraper.js
```

Defaults to:

* `target = books`
* Scrapes 1 page from the main catalog
* No image download

---

### 2. **Scraping by Genre**

```bash
node mainScraper.js --target genre --genres "Mystery,Travel"
```

* Scrapes the specified genres only
* Outputs one file per genre in `output/<Genre>/<Genre>.json`

---

### 3. **Smart Default: `--genres` Implies `--target genre`**

You can omit `--target genre`. The scraper will auto-correct for you:

```bash
node mainScraper.js --genres "Romance" --images true
```

This **automatically switches the target to `genre`** behind the scenes.

---

### 4. **Image Downloading**

Add `--images true` to download book cover images:

```bash
node mainScraper.js --genres "History" --images
```

Images are saved to `assets/<timestamp>/` by default.

You can change the output folder like:

```bash
node mainScraper.js --genres "Fiction" --images --assets "downloads/covers"
```

---

### 5. **Scraping Main Catalog with Pagination**

```bash
node mainScraper.js --target books --limit 5
```

Scrapes 5 pages from the main catalog.

---

### 6. **Extracting Images from an Existing List (Advanced)**

```bash
node mainScraper.js --target images --limit 10
```

Use this to only download images from a preprocessed list.

---

## Output Structure

* `output/books-<timestamp>.json` – When scraping the main catalog
* `output/<Genre>/<Genre>.json` – When scraping genres
* `assets/<timestamp>/` – Folder containing downloaded images
* `scraper.log` – Execution log

---

## Project Structure ## 

```
.
├── mainScraper.js
├── output/
├── assets/
├── modules/
│   ├── extractors/
│   │   ├── scrapeBooksByGenre.js
│   │   ├── scrapeGenrePage.js
│   │   └── extractBooksWithImages.js
│   ├── scrapePage.js
│   ├── pagination.js
│   ├── save.js
│   └── logger.js
└── README.md
```

---

## Dependencies ## 

* [puppeteer-extra](https://www.npmjs.com/package/puppeteer-extra)
* [puppeteer-extra-plugin-stealth](https://www.npmjs.com/package/puppeteer-extra-plugin-stealth)
* [yargs](https://www.npmjs.com/package/yargs)

---

## Example Scenarios ## 

* Scrape 3 genres and download covers:

  ```bash
  node mainScraper.js --genres "Science,Poetry,Travel" --images
  ```

* Scrape 10 catalog pages:

  ```bash
  node mainScraper.js --target books --limit 10
  ```

* Download images only (from cache or result set):

  ```bash
  node mainScraper.js --target images
  ```
