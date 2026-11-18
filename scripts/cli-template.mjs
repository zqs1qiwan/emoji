#!/usr/bin/env node
/* TypeScript-free CLI entry. This file is intentionally plain ESM so the
 * published package does not need Node type declarations at build time. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const { emoji, apps, metadata } = await import('./index.js');

const args = process.argv.slice(2);
const command = args[0] ?? 'help';
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};
const has = (name) => args.includes(`--${name}`);
const output = (value) => {
  if (has('json')) process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
  else if (typeof value === 'string') process.stdout.write(`${value}\n`);
  else process.stdout.write(`${JSON.stringify(value)}\n`);
};

if (command === 'get') {
  const value = emoji(args[1] ?? '');
  if (!value) {
    process.stderr.write(`Unknown emoji: ${args[1] ?? ''}\n`);
    process.exitCode = 1;
  } else {
    output(value);
  }
} else if (command === 'search') {
  output(emoji.search(args[1] ?? '', { app: option('app'), limit: Number(option('limit', '20')) }));
} else if (command === 'list') {
  output(emoji.list({ app: option('app'), limit: Number(option('limit', '20')) }));
} else if (command === 'render') {
  const text = args.slice(1).filter((value) => !value.startsWith('--')).join(' ');
  output(emoji.renderText(text));
} else if (command === 'apps') {
  output(Object.values(apps));
} else if (command === 'check') {
  const dataDir = path.join(here, 'data/generated');
  const checksums = JSON.parse(fs.readFileSync(path.join(dataDir, 'checksums.json'), 'utf8'));
  const failures = Object.entries(checksums).filter(([name, hash]) => {
    const content = fs.readFileSync(path.join(dataDir, name));
    const actual = crypto.createHash('sha256').update(content).digest('hex');
    return actual !== hash;
  });
  output({ ok: failures.length === 0, failures: failures.map(([file]) => file), metadata });
} else {
  output('Usage: emoji-kit <get|search|list|render|apps|check> [args] [--json] [--app name] [--limit n]');
}
