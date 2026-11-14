import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
