import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const countryCodes = require('country-codes-list');
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const outputDirectory = path.join(projectRoot, 'dist');
const publicPaths = [
  'index.html',
  'style.css',
  'script.js',
  'robots.txt',
  'sitemap.xml',
  'assets',
  'admin'
];

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (const relativePath of publicPaths) {
  await cp(
    path.join(projectRoot, relativePath),
    path.join(outputDirectory, relativePath),
    { recursive: true }
  );
}

const outputHtml = path.join(outputDirectory, 'index.html');
const html = await readFile(outputHtml, 'utf8');
const marker = '<!-- COUNTRY_CODE_OPTIONS -->';
if (!html.includes(marker)) {
  throw new Error('Country calling code options marker is missing from index.html.');
}

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[character]);
const options = countryCodes.all()
  .filter(country => /^\d{1,3}$/.test(country.countryCallingCode))
  .sort((a, b) => a.countryNameEn.localeCompare(b.countryNameEn))
  .map(country => {
    const code = `+${country.countryCallingCode}`;
    const selected = country.countryCode === 'NG' ? ' selected' : '';
    return `<option value="${country.countryCode}" data-dial-code="${code}"${selected}>${escapeHtml(country.countryNameEn)} (${code})</option>`;
  })
  .join('\n                ');
await writeFile(outputHtml, html.replace(marker, options));

if (process.env.PUBLIC_SITE_URL) {
  const siteUrl = new URL(process.env.PUBLIC_SITE_URL);
  if (siteUrl.protocol !== 'https:') {
    throw new Error('PUBLIC_SITE_URL must use https.');
  }

  const sourceDomain = 'https://nexportpro.com';
  const publicSiteUrl = siteUrl.origin;
  for (const relativePath of ['index.html', 'robots.txt', 'sitemap.xml']) {
    const filePath = path.join(outputDirectory, relativePath);
    const content = await readFile(filePath, 'utf8');
    await writeFile(filePath, content.replaceAll(sourceDomain, publicSiteUrl));
  }
}

console.log(`Prepared Pages assets in ${path.relative(projectRoot, outputDirectory)}.`);
