import { type Command } from '@commander-js/extra-typings';
import { S3Client } from 'bun';
import { setupS3Client } from '../core/s3-manager';
import { getExecutablePath } from '../core/browser-finder';
import { convertToPdf } from '../core/pdf-converter';
import { defineOptions } from './options';
import { handleInputOutput } from '../core/file-handler';
import { createBrowserCommand } from './browser-commands';

/**
 * @file src/cli/commands.ts
 * @description Configures all commands for the CLI application.
 */

export function configureCommands(program: Command) {
  // 1. Configure options for the root command.
  const configuredProgram = defineOptions(program);

  // 2. Define the action for the default command (conversion).
  configuredProgram
    .argument(
      '[input]',
      'Path to HTML file or URL. Supports local files, URLs, and S3.'
    )
    .argument(
      '[output]',
      'Path to the output PDF file. Supports local files and S3.'
    )
    .action(async (input, output, options) => {

      // --- Simplified UX Improvement ---
      // This action only runs if a subcommand (like 'browser') isn't specified.
      // We just need to check if the arguments for this default command are present.
      if (!input || !output) {
        // If not, show an error and the full help menu, then exit.
        // This handles cases like running `html2pdf` with no arguments.
        console.error('❌ Error: Missing required arguments <input> and <output> for conversion.\n');
        program.help();
        return;
      }
      // --- End of Simplified UX Improvement ---

      try {
        console.log('🚀 Starting HTML to PDF conversion...');

        const chromePath = await options.chromePath;
        const executablePathPromise = getExecutablePath(chromePath);

        const ioPromise = (async () => {
          let s3: S3Client | undefined;
          if (input.startsWith('s3://') || output.startsWith('s3://')) {
            s3 = setupS3Client(options);
          }
          return handleInputOutput(input, output, s3);
        })();

        const [executablePath, { inputSource, outputFile }] = await Promise.all([
          executablePathPromise,
          ioPromise,
        ]);

        if (!executablePath) {
          throw new Error('Chrome/Chromium executable not found. Try running "html2pdf browser install" or use --chrome-path.');
        }

        console.log(`✅ Browser found at: ${executablePath}`);
        console.log(`✅ Input/Output paths resolved.`);

        await convertToPdf({
          executablePath,
          inputSource,
          outputFile,
          timeout: options.timeout * 60 * 1000,
          pageFormat: options.pageFormat,
          removeSource: options.removeSource,
        });

        console.log('🎉 PDF conversion completed successfully!');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error(`❌ Operation failed: ${message}`);
        process.exit(1);
      }
    });

    // 3. Add the separate 'browser' subcommand.
    program.addCommand(createBrowserCommand());
}
