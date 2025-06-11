import { extname } from 'node:path';
import { type S3Client } from 'bun';
import { isValidUrl } from '../utils/url-validator';
import type { InputSource, OutputFile } from '../types';

/**
 * @file src/core/file-handler.ts
 * @description Handles logic for resolving input and output paths to readable/writable objects.
 */

function resolveInput(path: string, s3?: S3Client): InputSource {
  if (isValidUrl(path)) {
    const url = new URL(path);
    if (url.protocol === 's3:') {
      if (!s3) throw new Error('S3 client is required for S3 paths.');
      return { type: 'file', file: s3.file(path), path, isUrl: true };
    }
    const validHttpProtocols = ['http:', 'https:'];
    if (validHttpProtocols.includes(url.protocol)) {
      return { type: 'url', path, isUrl: true };
    }
    if (url.protocol === 'file:') {
       return { type: 'file', file: Bun.file(url.pathname), path: url.pathname, isUrl: true };
    }
    throw new Error(`Unsupported URL protocol: ${url.protocol}`);
  }

  const file = Bun.file(path);
  // For local files, if it's HTML, we'll convert to a file:// URL to handle relative assets correctly.
  if (extname(path) === '.html') {
      const fileUrl = Bun.pathToFileURL(path);
      return { type: 'url', path: fileUrl.toString(), isUrl: true };
  }
  // Otherwise, read its content directly.
  return { type: 'file', file, path, isUrl: false };
}

function resolveOutput(path: string, s3?: S3Client): OutputFile {
  if (isValidUrl(path)) {
    const url = new URL(path);
    if (url.protocol === 's3:') {
      if (!s3) throw new Error('S3 client is required for S3 paths.');
      return s3.file(path);
    }
    throw new Error(`Unsupported output URL protocol: ${url.protocol}. Only S3 is supported for URL outputs.`);
  }
  return Bun.file(path);
}

export async function handleInputOutput(input: string, output: string, s3?: S3Client): Promise<{ inputSource: InputSource; outputFile: OutputFile }> {
  try {
    const inputSource = resolveInput(input, s3);
    const outputFile = resolveOutput(output, s3);

    // Check if input file exists if it's a local non-URL file
    if (inputSource.type === 'file' && !inputSource.isUrl) {
        if (!(await inputSource.file.exists())) {
            throw new Error(`Input file not found at: ${inputSource.path}`);
        }
    }

    return { inputSource, outputFile };
  } catch (error) {
    console.error(`❌ Error resolving file paths:`, error);
    process.exit(1);
  }
}
