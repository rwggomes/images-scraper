import fs from 'fs';
import { format } from 'date-fns';

let logStream;

export function setupLogger(logPath = 'scraper.log') {
  logStream = fs.createWriteStream(logPath, { flags: 'a' });
}

function writeLog(level, message) {
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  const fullMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

  // Write to file
  if (logStream) logStream.write(fullMessage);

  // Always show in terminal
  console.log(fullMessage.trim());
}

export function logInfo(message) {
  writeLog('info', message);
}

export function logWarn(message) {
  writeLog('warn', message);
}

export function logError(message) {
  writeLog('error', message);
}

export function logStart() {
  const start = Date.now();
  logInfo('_____________ Scraping started_____________');
  return start;
}

export function logEnd(startTime) {
  const end = Date.now();
  const duration = ((end - startTime) / 1000).toFixed(2);
  logInfo(`Scraping completed in ${duration}s`);
}