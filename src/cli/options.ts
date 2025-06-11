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
        .choices(['A4', 'A3', 'A2', 'Letter', 'Legal'])
        .default('Legal')
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
    .optionsGroup('S3 Options: ')
    .option('--s3-access-key-id <value>', 'AWS S3 access key ID. Overrides environment variable S3_ACCESS_KEY_ID.')
    .option('--s3-secret-access-key <value>', 'AWS S3 secret access key. Overrides environment variable S3_SECRET_ACCESS_KEY.')
    .option('--s3-bucket <value>', 'AWS S3 bucket name. Overrides environment variable S3_BUCKET.')
    .option('--s3-region <value>', 'AWS S3 region. Overrides environment variable S3_REGION.')
    .option('--s3-endpoint <value>', 'AWS S3 endpoint URL. Overrides environment variable S3_ENDPOINT.')
}
