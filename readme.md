# Books Scraper

A modular, headless Puppeteer scraper for [books.toscrape.com](https://books.toscrape.com/), designed for flexibility, performance, and maintainability. Supports paginated scraping, genre filtering, CSV/JSON export, and optional image downloading.

---

## Features

* Modular architecture with extractors (`scrapePage`, `scrapeGenrePage`, `pagination`, etc.)
* Pagination support for both catalog and genre views
* Genre-specific scraping with validation against the available list
* Optional image downloading with:

  * Filename sanitization
  * Duplicate filename resolution
  * Extension validation

* CLI support with:

  * Runtime validation and helpful error messages
  * Configurable retries, delay, limits
  
* Timestamped output directories and asset folders

---

## Getting Started

```bash
git clone https://github.com/your-username/books-scraper
cd books-scraper
npm install
```

---

## Usage Examples

### Scrape the main catalog (first 3 pages)

```bash
node mainScraper.js --target books --limit 3
```

### Scrape specific genres

```bash
node mainScraper.js --genres "Romance,Travel"
```

### Scrape genres and download images

```bash
node mainScraper.js --target genre --images true --genres "Science"
```

---

## CLI Options

| Flag             | Description                                                | Default        |
| ---------------- | ---------------------------------------------------------- | -------------- |
| `--target`, `-t` | Scraping mode: `books`, `genre`, or `images`               | `books`        |
| `--limit`, `-l`  | Maximum number of pages to scrape                          | `1`            |
| `--genres`       | Comma-separated list of genres to scrape                   | *(all genres)* |
| `--genre-limit`  | Limit the number of genres processed                       | *(no limit)*   |
| `--images`       | Enable downloading of book cover images                    | `false`        |
| `--delay`, `-d`  | Delay in milliseconds between page loads                   | `1000`         |
| `--max-retries`  | Number of retry attempts per page if errors occur          | `2`            |
| `--output`       | Custom output file path (auto timestamped if not provided) | auto-generated |
| `--assets`       | Folder path to save downloaded images                      | `assets/`      |
| `--log`          | Path to the log file                                       | `scraper.log`  |
| `--headless`     | Run Puppeteer in headless mode                             | `true`         |

**Note:** Runtime validation is applied. Example error:

```
Invalid --limit: 1000. Must be between 1 and 50. Did you mean --limit 50?
```

---

## Output Structure

* Scraped data is saved in the `/output/` directory.
* Image files are stored under `/assets/[label]-[timestamp]/`.
* Log messages are written to `scraper.log`.

---

## Development Notes

* All scraping constants (e.g. retry delays, filename limits) are stored in `config/constants.js`.
* CLI configurations are managed in `config/cli.js`.
* Each module is independent and testable.
* Built with Puppeteer using the stealth plugin to avoid basic bot detection.

---

