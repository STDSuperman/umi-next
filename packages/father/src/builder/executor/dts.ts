import { deepmerge as deepMerge, fsExtra } from '@umijs/utils';
import path from 'path';
import type { CompilerOptions, TypeAcquisition } from 'typescript';
import ts from 'typescript';
import type { ITransformerConfig } from './bundless';

export interface TsConfig {
  compilerOptions: CompilerOptions;
  exclude: string[];
  compileOnSave: boolean;
  extends: string;
  files: string[];
  include: string[];
  typeAcquisition: TypeAcquisition;
}

const INITIAL_COMPILER_OPTIONS: CompilerOptions = {
  experimentalDecorators: true,
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
  declaration: true,
  emitDeclarationOnly: true,
  allowJs: true,
};

/**
 * generate .d.ts files
 * @param fileNames
 * @param config
 */
export const generateDtsFile = (
  fileNames: string[],
  config: ITransformerConfig,
) => {
  const createdFiles: Record<string, string> = {};
  // merge compiler config
  const compilerOptions: CompilerOptions = deepMerge(
    mergeTsCompilerOptions(config),
    INITIAL_COMPILER_OPTIONS,
  );

  // get .d.ts files out dir
  if (config?.output) {
    compilerOptions.outDir = config?.output;
  }
  const declarationDir = compilerOptions.outDir ?? 'dist';

  // clean output dir
  fsExtra.removeSync(declarationDir);
  // ensure output dir exists
  fsExtra.ensureDirSync(declarationDir);

  const host = ts.createCompilerHost(compilerOptions);
  // save emit file info
  host.writeFile = (filename: string, content: string) =>
    (createdFiles[filename] = content);
  const program = ts.createProgram(fileNames, compilerOptions, host);
  program.emit();

  Object.keys(createdFiles).forEach((file) => {
    const dtsContent = createdFiles[file];
    // ensure parent directory exists
    fsExtra.ensureDirSync(path.dirname(file));
    fsExtra.writeFileSync(file, dtsContent);
  });
};

/**
 * merge tsconfig compilerOptions
 * @param config
 * @returns
 */
export const mergeTsCompilerOptions = (
  config: ITransformerConfig,
): CompilerOptions => {
  // find tsconfig.json
  const tsconfigFilePath = ts.findConfigFile(
    config?.cwd ?? process.cwd(),
    ts.sys.fileExists,
  );

  if (!tsconfigFilePath) return {};
  // resolve tsconfig.json path
  const resolvedTsConfigFilePath = require.resolve(tsconfigFilePath);
  // read tsconfig.json
  const tsconfig = getTsConfig(resolvedTsConfigFilePath);
  return tsconfig.compilerOptions;
};

/**
 * read tsconfig configuration
 * @param filePath
 * @returns
 */
export const getTsConfig = (filePath: string): TsConfig => {
  const config = fsExtra.readJSONSync(filePath) ?? {};
  if (config.extends) {
    const extendsTsConfigFilePath = path.resolve(
      path.dirname(filePath),
      config.extends,
    );
    if (!fsExtra.existsSync(extendsTsConfigFilePath)) {
      throw new Error(`${extendsTsConfigFilePath} is not found`);
    }
    delete config.extends;
    return deepMerge(config, getTsConfig(extendsTsConfigFilePath));
  }
  return config;
};
