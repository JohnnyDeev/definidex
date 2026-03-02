import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const logs: string[] = [];
    page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => logs.push(`[CRITICAL] ${err.toString()}`));

    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    fs.writeFileSync('public/data/debug.txt', logs.join('\n'));
    await browser.close();
})();
