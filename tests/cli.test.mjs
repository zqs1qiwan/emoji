import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const cliSource = fs.readFileSync(path.join(root, 'dist/cli.js'), 'utf8');

assert.match(cliSource, /^#!/);
for (const command of ['get', 'search', 'list', 'render', 'apps', 'check']) {
  assert.match(cliSource, new RegExp(`command === '${command}'`));
}
assert.match(cliSource, /createHash\('sha256'\)/);
process.stdout.write('CLI entry structure checks passed.\n');
