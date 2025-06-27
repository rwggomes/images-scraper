import fs from 'fs';
import path from 'path';
import https from 'https';

/**
 * Downloads an image to the given folder using a sanitized, conflict-free filename.
 */
export const downloadImage = (url, folder, title) => {
  return new Promise((resolve, reject) => {
    try {
      // Validate URL
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch (err) {
        return reject(new Error(`Invalid URL: ${url}`));
      }

      // Ensure file extension
      let ext = path.extname(parsedUrl.pathname).split('?')[0].toLowerCase();
      if (!ext || ext.length > 5) ext = '.jpg'; // Fallback to .jpg if extension is missing, invalid or too long


      // Validate extension
      const VALID_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
      // If the extension is not valid or too long, default to .jpg
      if (!VALID_EXTENSIONS.has(ext) || ext.length > 6) {
        ext = '.jpg';
      }
      // Sanitize filename
      const MAX_FILENAME_LENGTH = 50; // Limit filename length for cross-platform compatibility
      const safeTitle = title
        .replace(/[^a-zA-Z0-9\-_\s]/g, '')   // Remove illegal chars
        .trim()
        .replace(/\s+/g, '_')                // Normalize spaces to underscores
        .substring(0, MAX_FILENAME_LENGTH); // // Trim title to avoid OS-level filename length issues


      // Resolve filename with conflict avoidance
      let filename = `${safeTitle}${ext}`;
      let fullPath = path.join(folder, filename);
      let counter = 1;

      while (fs.existsSync(fullPath)) {
        filename = `${safeTitle}(${counter})${ext}`;
        fullPath = path.join(folder, filename);
        counter++;
      }

      // Create folder if needed
      fs.mkdirSync(folder, { recursive: true });

      // Begin download
      const file = fs.createWriteStream(fullPath);
      https.get(parsedUrl.href, (response) => {
        if (response.statusCode !== 200) {
          return reject(new Error(`Request failed: ${response.statusCode}`));
        }

        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`Downloaded: ${filename}`);
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(fullPath, () => { }); // Cleanup partial file
        reject(new Error(`Download error: ${err.message}`));
      });
    } catch (err) {
      reject(new Error(`Unexpected error: ${err.message}`));
    }
  });
};
