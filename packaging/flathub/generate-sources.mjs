import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, '..', '..');
const lockfilePath = path.join(repoRoot, 'package-lock.json');
const outputPath = path.join(currentDir, 'npm-sources.json');

const lockfile = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
const packages = Object.values(lockfile.packages ?? {});
const entries = [];
const seen = new Set();

for (const pkg of packages) {
  if (!pkg?.resolved || !pkg?.integrity) {
    continue;
  }

  const [algorithm, digestBase64] = pkg.integrity.split('-', 2);
  if (!algorithm || !digestBase64) {
    continue;
  }

  const digestHex = Buffer.from(digestBase64, 'base64').toString('hex');
  const dedupeKey = `${pkg.resolved}|${algorithm}|${digestHex}`;
  if (seen.has(dedupeKey)) {
    continue;
  }
  seen.add(dedupeKey);

  entries.push({
    type: 'file',
    url: pkg.resolved,
    [algorithm]: digestHex,
    'dest-filename': digestHex.slice(4),
    dest: `flatpak-node/npm-cache/_cacache/content-v2/${algorithm}/${digestHex.slice(0, 2)}/${digestHex.slice(2, 4)}`
  });
}

entries.sort((left, right) => left.url.localeCompare(right.url));
fs.writeFileSync(outputPath, `${JSON.stringify(entries, null, 2)}\n`);
console.error(`wrote ${entries.length} npm sources to ${path.relative(repoRoot, outputPath)}`);
