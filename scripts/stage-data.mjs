import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const generatedFiles = [
  'emojis.json',
  'aliases.json',
  'apps.json',
  'assets.json',
  'meta.json',
  'resources.json',
  'checksums.json',
];

/** Materialize checked-in generated data into the ignored source copy. */
export function stageGeneratedData(root = process.cwd()) {
  for (const name of generatedFiles) {
    const source = path.join(root, 'data/generated', name);
    const target = path.join(root, 'src/data/generated', name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
  fs.writeFileSync(path.join(root, 'src/data/generated/.gitignore'), '*\n!.gitignore\n');
}

export const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const packageRoot = path.dirname(scriptDir);
