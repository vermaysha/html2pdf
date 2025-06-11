import type { BunFile, S3File } from 'bun';
import type { PaperFormat } from 'puppeteer-core';

/**
 * @file src/types/index.ts
 * @description Contains shared TypeScript types for the application.
 */

export type BrowserPath = string | null;

export type OutputFile = BunFile | S3File;

export type InputSource =
  | { type: 'url'; path: string; isUrl: true; }
  | { type: 'file'; file: BunFile | S3File; path: string; isUrl: boolean; };

/**
 * Defines the shape of the options object parsed from the command line.
 * This ensures type safety for all CLI options.
 */
export interface CliOptions {
  chromePath?: string;
  pageFormat: PaperFormat;
  timeout: number;
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
  s3Bucket?: string;
  s3Region?: string;
  s3Endpoint?: string;
  removeSource: boolean;
}
