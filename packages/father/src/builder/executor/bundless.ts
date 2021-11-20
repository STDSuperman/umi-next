import { glob, winPath } from '@umijs/utils';
import fs from 'fs';
import path from 'path';
import type { IFatherBaseConfig, IFatherTransformerConfig } from '../../types';
import type { ITransformer } from '../protocol';
import { generateDtsFile } from './dts';

/**
 * declare bundless config
 */
export interface ITransformerConfig
  extends IFatherBaseConfig,
    Omit<IFatherTransformerConfig, 'input' | 'overrides'> {
  type: 'bundless';
  input: string;
}

export default async (
  config: ITransformerConfig,
  transformer: InstanceType<ITransformer>,
) => {
  const matches: string[] = [];

  if (fs.lstatSync(config.input).isDirectory()) {
    // match all available files within directory
    matches.push(
      ...glob.sync(`${config.input}/**`, {
        ignore: config.ignores,
      }),
    );
  } else {
    // match single file
    matches.push(config.input);
  }

  // process all matched items
  matches.forEach((item) => {
    let itemDistPath = winPath(
      path.join(config.output!, path.relative(config.input, item)),
    );

    if (fs.lstatSync(item).isDirectory()) {
      // mkdir in dist
      fs.mkdirSync(itemDistPath, { recursive: true });
    } else {
      let result: string;

      if (/\.(j|t)sx?$/.test(item)) {
        // transform javascript files
        result = transformer.process(fs.readFileSync(item, 'utf8').toString());

        // replace ext
        itemDistPath = itemDistPath.replace(/\.[^.]+$/, '.js');
      } else {
        // TODO: support to transform other files (such as minify images?)
        result = fs.readFileSync(item, 'utf8').toString();
      }

      // distribute file
      fs.writeFileSync(itemDistPath, result);
    }
  });

  // generate .d.ts files
  generateDtsFile(matches, config);

  // TODO: watch mode
};
