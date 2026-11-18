import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { generatedFiles, stageGeneratedData, packageRoot } from './stage-data.mjs';

const root = packageRoot;
const dist = path.join(root, 'dist');
stageGeneratedData(root);
fs.rmSync(dist, { recursive: true, force: true });
for (const name of ['dist', 'data/generated']) fs.mkdirSync(path.join(root, name), { recursive: true });

const configPath = path.join(root, 'tsconfig.json');
const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
if (configFile.error) throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'));
const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root);
if (config.errors.length) throw new Error(ts.formatDiagnostics(config.errors, {
  getCanonicalFileName: (n) => n,
  getCurrentDirectory: () => root,
  getNewLine: () => '\n',
}));

const program = ts.createProgram(config.fileNames, {
  ...config.options,
  noEmit: false,
  declaration: true,
  emitDeclarationOnly: false,
  outDir: dist,
  rootDir: path.join(root, 'src'),
});
const emit = program.emit();
const diagnostics = ts.getPreEmitDiagnostics(program).concat(emit.diagnostics);
if (diagnostics.length) {
  throw new Error(ts.formatDiagnostics(diagnostics, {
    getCanonicalFileName: (n) => n,
    getCurrentDirectory: () => root,
    getNewLine: () => '\n',
  }));
}

// TypeScript emits directly into dist with rootDir=src.
function shim(name, target) {
  fs.writeFileSync(path.join(dist, name), `'use strict';\nconst mod = require('./${target}');\nmodule.exports = mod;\n`);
}
for (const name of ['index', 'core', 'data', 'react']) shim(`${name}.cjs`, `${name}.js`);

// The CLI is authored as plain ESM to avoid requiring Node typings in the
// browser-safe TypeScript build; copy its source verbatim.
fs.copyFileSync(path.join(root, 'scripts/cli-template.mjs'), path.join(dist, 'cli.js'));
try { fs.chmodSync(path.join(dist, 'cli.js'), 0o755); } catch { /* Windows: set the executable bit in git with update-index --chmod=+x src/cli-template.mjs */ }

// TypeScript copies imported JSON into dist/data/generated. Keep those files as
// the only runtime copy and expose top-level aliases for the CLI and consumers.
for (const name of generatedFiles) {
  fs.copyFileSync(path.join(root, 'data/generated', name), path.join(dist, 'data/generated', name));
}
// TypeScript re-emits a restrictive .gitignore into this directory when it
// copies the imported JSON. npm honors nested .gitignore rules and would omit
// the runtime data from the tarball, so remove it after the emit.
fs.rmSync(path.join(dist, 'data/generated/.gitignore'), { force: true });

process.stdout.write(`Built ${fs.readdirSync(dist).length} files in dist.\n`);
