import ts from 'typescript';
import type { ITransformerConfig } from './bundless';

export const generateDtsFile = (
  fileNames: string[],
  config: ITransformerConfig,
) => {
  const createdFiles: Record<string, string> = {};
  console.log(config);
  const compileConfig = {};
  const host = ts.createCompilerHost(compileConfig);
  host.writeFile = (filename: string, content: string) =>
    (createdFiles[filename] = content);
  const program = ts.createProgram(fileNames, compileConfig, host);
  program.emit();

  console.log(fileNames);

  fileNames.forEach((file) => {
    console.log('### JavaScript\n');
    console.log(host.readFile(file));

    console.log('### Type Definition\n');
    const dts = file.replace('.js', '.d.ts');
    console.log(createdFiles[dts]);
  });
};
