import esbuild from '@umijs/bundler-utils/compiled/esbuild';
import { chalk, register, yParser } from '@umijs/utils';
import assert from 'assert';
import { existsSync } from 'fs';
import { basename, extname, join } from 'path';
import { build } from './build';

const args = yParser(process.argv.slice(2), {});
const command = args._[0];
const cwd = process.cwd();

const entry = tryPaths([
  join(cwd, 'src/index.tsx'),
  join(cwd, 'src/index.ts'),
  join(cwd, 'index.tsx'),
  join(cwd, 'index.ts'),
]);

let config = {};
const configFile = join(cwd, args.config || 'config.ts');
register.register({
  implementor: esbuild,
});
register.clearFiles();
if (existsSync(configFile)) {
  config = require(configFile).default;
}
Object.assign(config, args);

if (command === 'build') {
  (async () => {
    process.env.NODE_ENV = 'production';
    assert(entry, `Build failed: entry not found.`);
    try {
      await build({
        config,
        cwd,
        entry: {
          [getEntryKey(entry)]: entry,
        },
      });
    } catch (e) {
      console.error(e);
    }
  })();
} else {
  error(`Unsupported command ${command}.`);
}

function error(msg: string) {
  console.error(chalk.red(msg));
}

function tryPaths(paths: string[]) {
  for (const path of paths) {
    if (existsSync(path)) return path;
  }
}

function getEntryKey(path: string) {
  return basename(path, extname(path));
}
