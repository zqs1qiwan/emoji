import ts from 'typescript';

const configPath = new URL('../tsconfig.json', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
if (configFile.error) throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'));
const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, configPath.replace(/tsconfig\.json$/, ''));
if (config.errors.length) throw new Error(ts.formatDiagnostics(config.errors, {
  getCanonicalFileName: (name) => name,
  getCurrentDirectory: () => process.cwd(),
  getNewLine: () => '\n',
}));
const program = ts.createProgram(config.fileNames, { ...config.options, noEmit: true });
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) {
  throw new Error(ts.formatDiagnostics(diagnostics, {
    getCanonicalFileName: (name) => name,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => '\n',
  }));
}
process.stdout.write('TypeScript check passed.\n');
