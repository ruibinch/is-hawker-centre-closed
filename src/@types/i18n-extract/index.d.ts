declare module 'i18n-extract' {
  // ref: https://github.com/babel/babel/blob/master/packages/babel-parser/src/util/location.js
  type Position = {
    line: number;
    column: number;
  };

  // ref: https://github.com/babel/babel/blob/master/packages/babel-parser/src/util/location.js
  type SourceLocation = {
    start: Position;
    end: Position;
    filename: string | undefined;
    identifierName: string | undefined;
  };

  type ExtractBaseOptions = {
    marker: string;
    keyLoc?: number;
  };

  type ExtractAdditionalOptions =
    | {
        parser: 'flow' | 'typescript';
      }
    | {
        babelOptions: unknown; // Babel configuration object
      };

  type ExtractOptions = ExtractBaseOptions & ExtractAdditionalOptions;

  export type KeyExtractedFromCode = {
    key: string;
    loc: SourceLocation;
  };

  export type KeyExtractedFromFile = KeyExtractedFromCode & {
    file: string;
  };

  export function extractFromCode(
    code: string,
    options: ExtractOptions,
  ): KeyExtractedFromCode[];

  export function extractFromFiles(
    filenames: string[],
    options: ExtractOptions,
  ): KeyExtractedFromFile[];

  type ReportType = 'MISSING' | 'UNUSED' | 'DUPLICATED';

  type Report<T extends ReportType> = KeyExtractedFromCode & {
    type: T;
  };

  export function findMissing(
    locale: Record<string, string>,
    keysUsed: KeyExtractedFromCode[],
  ): Report<'MISSING'>[];

  export function findUnused(
    locale: Record<string, string>,
    keysUsed: KeyExtractedFromCode[],
  ): Report<'UNUSED'>[];
}
