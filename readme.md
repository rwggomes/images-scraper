# Books Scraper

A modular, headless Puppeteer scraper for [books.toscrape.com](https://books.toscrape.com/), designed for flexibility, performance, and maintainability. Supports paginated scraping, genre filtering, JSON export, and optional image downloading grouped by page.

---

## Features

* Modular architecture with extractors (`scrapePage`, `scrapeGenrePage`, `pagination`, etc.)
* Pagination support for both catalog and genre views
* Genre-specific scraping with validation against the available list
* Optional image downloading with:

  * Filename sanitization
  * Duplicate filename resolution
  * Extension validation
  * Automatic grouping into subfolders by page when `--limit > 1`
* CLI support with:

  * Runtime validation and helpful error messages with suggestions
  * Configurable retry attempts, request delays, and scraping limits
* Timestamped output directories and asset folders
* All scraping constants and defaults stored in `config/constants.js`

---

## Getting Started

```bash
git clone https://github.com/rwggomes/books-scraper
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

### Scrape genres and download images (grouped by genre and page if `--limit > 1`)

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

**Note:** All numeric inputs are validated. You’ll get clear messages like:

```
Invalid --limit: 1000. Must be between 1 and 50. Did you mean --limit 50?
```

---

## Output Structure

* Scraped data is saved to the `/output/` directory.
* Downloaded images are saved under `/assets/[label]-[timestamp]/`

  * When `--limit > 1`, images are grouped in subfolders by page: `page-1/`, `page-2/`, etc.
* Logs are written to `scraper.log`.

---

## Development Notes

* All scraping constants (e.g., delays, limits, paths) are defined in `config/constants.js`
* CLI definitions and validation are managed in `config/cli.js`
* Image filenames are sanitized and de-duplicated
* Code is organized into small, testable modules
* Built with Puppeteer and `puppeteer-extra` using the stealth plugin for bot evasion


