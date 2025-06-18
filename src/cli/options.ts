import { Option, type Command } from '@commander-js/extra-typings';

/**
 * @file src/cli/options.ts
 * @description Defines all command-line options for the application.
 */

export function defineOptions(program: Command) {
  return program
    .addOption(
      new Option('-c, --chrome-path <path>', 'Path to the Chrome/Chromium executable.')
        .argParser(async (value) => {
          const file = Bun.file(value);
          if (!(await file.exists())) {
            throw new Error(`Chrome executable not found at: ${value}`);
          }
          return value;
        })
    )
    .addOption(
      new Option('-p, --page-format <format>', 'PDF page format.')
        .choices(['Letter', 'Legal', 'Tabloid', 'Ledger', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6'])
        .default('Legal')
    )
    .addOption(
      new Option('-l, --page-layout <layout>', 'PDF page layout.')
        .choices(['Portrait', 'Landscape'])
        .default('Portrait')
    )
    .addOption(
      new Option('-t, --timeout <number>', 'Timeout in minutes for page loading and PDF generation.')
        .default(5)
        .argParser(parseInt)
    )
    .addOption(
      new Option('-d, --remove-source', 'Remove the source file after successful conversion.')
        .default(false)
    )
    .addOption(
      new Option('--compress', 'Compress the generated PDF with Ghostscript.')
        .default(false)
    )
    .optionsGroup('S3 Options: ')
    .option('--s3-access-key-id <value>', 'AWS S3 access key ID. Overrides environment variable S3_ACCESS_KEY_ID.')
    .option('--s3-secret-access-key <value>', 'AWS S3 secret access key. Overrides environment variable S3_SECRET_ACCESS_KEY.')
    .option('--s3-region <value>', 'AWS S3 region. Overrides environment variable S3_REGION.')
    .option('--s3-endpoint <value>', 'AWS S3 endpoint URL. Overrides environment variable S3_ENDPOINT.')
}
