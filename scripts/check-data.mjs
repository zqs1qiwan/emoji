import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const dir = path.join(process.cwd(), 'data/generated');
const checksums = JSON.parse(fs.readFileSync(path.join(dir, 'checksums.json'), 'utf8'));
let ok = true;

for (const [name, expected] of Object.entries(checksums)) {
  if (name === 'checksums.json') continue;
  const file = path.join(dir, name);
  if (!fs.existsSync(file)) {
    console.error(`MISSING ${name}`);
    ok = false;
    continue;
  }
  const actual = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  if (actual !== expected) {
    console.error(`CHANGED ${name}: expected ${expected}, got ${actual}`);
    ok = false;
  }
}

// Every generated file has to be covered by a checksum entry.
for (const name of fs.readdirSync(dir)) {
  if (name === 'checksums.json' || !name.endsWith('.json')) continue;
  if (!(name in checksums)) {
    console.error(`UNCHECKED ${name}`);
    ok = false;
  }
}

if (!ok) process.exit(1);
console.log(`Verified ${Object.keys(checksums).length} generated data files.`);
