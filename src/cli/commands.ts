import { type Command } from '@commander-js/extra-typings';
import { S3Client } from 'bun';
import { setupS3Client } from '../core/s3-manager';
import { getExecutablePath } from '../core/browser-finder';
import { convertToPdf } from '../core/pdf-converter';
import { defineOptions } from './options';
import { handleInputOutput } from '../core/file-handler';
import type { CliOptions } from '../types'; // Import the new type
import { createBrowserCommand } from './browser-commands';

/**
 * @file src/cli/commands.ts
 * @description Configures the main command, arguments, and action for the CLI.
 */

export function configureCommands(program: Command) {
  // Define all CLI options
  const configuredProgram = defineOptions(program);

  // Define arguments and the main action
  configuredProgram
    .addCommand(createBrowserCommand())
    .argument(
      'input',
      'Path to HTML file or URL. Supports local files (relative/absolute), URLs (http, https, file), and S3 (s3://).'
    )
    .argument(
      'output',
      'Path to the output PDF file. Supports local files (relative/absolute) and S3 (s3://).'
    )
    .action(async (input: string, output: string, options) => {
      try {
        console.log('🚀 Starting HTML to PDF conversion...');

        const opt = options as CliOptions;

        // Run initial I/O-bound tasks in parallel
        const executablePathPromise = getExecutablePath(opt.chromePath);

        const ioPromise = (async () => {
          let s3: S3Client | undefined;
          if (input.startsWith('s3://') || output.startsWith('s3://')) {
            // All s3 options are now accessible in a type-safe manner
            s3 = setupS3Client(options);
          }
          return handleInputOutput(input, output, s3);
        })();

        // Await both tasks to complete
        const [executablePath, { inputSource, outputFile }] = await Promise.all(
          [executablePathPromise, ioPromise]
        );

        if (!executablePath) {
          throw new Error(
            'Chrome/Chromium executable not found. Please specify the path with --chrome-path or install a compatible browser.'
          );
        }

        console.log(`✅ Browser found at: ${executablePath}`);
        console.log(`✅ Input/Output paths resolved.`);

        // Perform the main conversion task, passing the type-safe options
        await convertToPdf({
          executablePath,
          inputSource,
          outputFile,
          timeout: opt.timeout * 60 * 1000,
          pageFormat: opt.pageFormat,
          removeSource: opt.removeSource,
        });

        console.log('🎉 PDF conversion completed successfully!');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error(`❌ Operation failed: ${message}`);
        process.exit(1);
      }
    });
}
