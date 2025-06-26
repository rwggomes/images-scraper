import fs from 'fs-extra';
import path from 'path';
import { format as formatDate } from 'date-fns';
import { logInfo } from './logger.js';
import { createWriteStream } from 'fs';

import http from 'http';
import https from 'https';
import { createObjectCsvWriter } from 'csv-writer';

export async function saveResults(data, format = 'json', _, target = 'results', argv = {}) {
  if (!data || data.length === 0) {
    console.warn('No data to save.');
    return;
  }
  const outputDir = 'output';
  const timestamp = formatDate(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  const filename = `${target}-${timestamp}.${format}`;
  const outputPath = path.join('output', filename);


  await fs.ensureDir(outputDir);

  if (format === 'csv') {
    const csvWriter = createObjectCsvWriter({
      path: outputPath,
      header: Object.keys(data[0]).map((key) => ({ id: key, title: key })),
    });
    await csvWriter.writeRecords(data);
  } else {
    await fs.writeJson(outputPath, data, { spaces: 2 });
  }

  logInfo(`Saved ${data.length} items to ${outputPath}`);

  if (argv.downloadAssets) {
    const assetUrls = extractAssetUrls(data);
    await downloadAssets(assetUrls, target);
  }
}

export async function saveToFile(filePath, data, options = {}) {
  await fs.ensureDir(path.dirname(filePath));

  if (Buffer.isBuffer(data)) {
    await fs.writeFile(filePath, data, options);
  } else if (typeof data === 'object') {
    await fs.writeJson(filePath, data, { spaces: 2, ...options });
  } else {
    await fs.writeFile(filePath, data, options);
  }

  logInfo(`Saved file: ${filePath}`);
}

export async function downloadAssets(urls, target = 'assets') {
  if (!urls?.length) {
    console.warn('No assets to download.');
    return;
  }

  const downloadDir = path.resolve('assets', target);
  await fs.ensureDir(downloadDir);

  for (const url of urls) {
    try {
      const fileName = path.basename(url.split('?')[0]);
      const filePath = path.join(downloadDir, fileName);
      const lib = url.startsWith('https') ? https : http;

      await new Promise((resolve, reject) => {
        const file = createWriteStream(filePath);
        lib.get(url, (res) => {
          if (res.statusCode !== 200) {
            return reject(new Error(`Failed (${res.statusCode})`));
          }

          res.pipe(file);
          file.on('finish', () => {
            file.close();
            logInfo(`Downloaded: ${filePath}`);
            resolve();
          });
        }).on('error', (err) => {
          fs.unlink(filePath, () => {});
          reject(err);
        });
      });
    } catch (err) {
      console.error(`Download failed: ${url} → ${err.message}`);
    }
  }
}

function extractAssetUrls(data) {
  return data.flatMap(item =>
    Object.values(item).filter(
      val => typeof val === 'string' && /\.(png|jpe?g|pdf)$/i.test(val)
    )
  );
}