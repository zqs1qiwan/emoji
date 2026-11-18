import fs from 'node:fs';
import path from 'node:path';

const artifactNames = [
  '.npm-local.js',
  '.npm-local.mjs',
  'install.log',
  'dsh-spill',
  'web_fetch.txt',
  'debug-notes',
];
const artifactDirs = ['.npm-cache', 'data/cache'];
const sessionPattern = /session-[0-9a-f]{8,}/i;
const roots = ['README.md', 'AGENTS.md', 'CONTRIBUTING.md', 'CHANGELOG.md', 'NOTICE', 'LICENSE', 'docs', 'src', 'scripts', 'data/sources', 'package.json', '.github', 'examples'].filter((p) => fs.existsSync(p));
const offenders = [];

function walk(file) {
  if (fs.statSync(file).isDirectory()) {
    for (const entry of fs.readdirSync(file)) walk(path.join(file, entry));
    return;
  }
  const normalized = file.replaceAll('\\', '/');
  if (/\.(png|jpe?g|gif|webp|ico)$/i.test(file)) {
    offenders.push(`${file}: binary artwork`);
    return;
  }
  if (normalized.startsWith('node_modules/')) return;
  if (sessionPattern.test(normalized)) offenders.push(`${file}: session artifact name`);
  const text = fs.readFileSync(file, 'utf8');
  if (/[A-Za-z]:\\Users\\/.test(text) || /[A-Za-z]:\/Users\//.test(text)) {
    offenders.push(`${file}: local absolute path`);
  }
}

for (const root of roots) walk(root);
for (const name of artifactNames) {
  if (fs.existsSync(name)) offenders.push(`${name}: private artifact present`);
}
for (const dir of artifactDirs) {
  if (fs.existsSync(dir)) offenders.push(`${dir}: private artifact directory present`);
}
if (fs.existsSync('.gitignore')) {
  const ignored = fs.readFileSync('.gitignore', 'utf8');
  for (const required of ['.npm-cache', 'data/cache', 'node_modules', '*.log']) {
    if (!ignored.includes(required)) offenders.push(`.gitignore missing ${required}`);
  }
}

if (offenders.length) {
  console.error('Public hygiene check failed:');
  for (const item of offenders) console.error(`  ${item}`);
  process.exit(1);
}
console.log('Public hygiene check passed.');
