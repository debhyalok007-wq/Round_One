import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 8765;

// Simple static server
const server = http.createServer((req, res) => {
  let filePath = path.join(process.cwd(), decodeURIComponent(req.url));
  if (filePath.endsWith('/')) filePath += 'index.html';
  const ext = path.extname(filePath).toLowerCase();
  const mime = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.mp3': 'audio/mpeg'
  }[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto(`http://localhost:${PORT}/index.html`);
  await page.waitForTimeout(500);

  // Advance to waveform-paused slide (slide-5): 5 clicks
  for (let i = 0; i < 5; i++) {
    await page.click('body');
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'verify_waveform_paused.png' });
  console.log('Captured paused waveform');

  // Advance to waveform-playing slide (slide-6): 1 click
  await page.click('body');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'verify_waveform_playing_1.png' });
  console.log('Captured playing waveform 1');

  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'verify_waveform_playing_2.png' });
  console.log('Captured playing waveform 2');

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'verify_waveform_playing_3.png' });
  console.log('Captured playing waveform 3');

  // Advance to waveform-ended slide (slide-7): double click to advance
  await page.dblclick('body');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'verify_waveform_ended.png' });
  console.log('Captured ended waveform');

  await browser.close();
  server.close();
  console.log('Done');
});
