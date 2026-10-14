import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const pages = [];
for (let page = 1; page <= 58; page++) {
  const file = path.join(root, 'work/extracted', `page-${page}.txt`);
  const text = fs.readFileSync(file, 'utf8')
    .replace(/\f/g, '')
    .replace(/^[ \t]*\d+[ \t]*$/gm, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  pages.push({ page, text });
}
fs.mkdirSync(path.resolve(import.meta.dirname, '../dist'), { recursive: true });
fs.writeFileSync(path.resolve(import.meta.dirname, '../dist/pages.js'), `window.NOTES_PAGES=${JSON.stringify(pages)};\n`);
