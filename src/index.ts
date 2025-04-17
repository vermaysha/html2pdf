import puppeteer from 'puppeteer-core';
import { exists } from 'node:fs/promises';
import { program } from 'commander';
import { exec } from 'node:child_process';
import { extname, resolve } from 'node:path';

/**
 * Converts the difference between two timestamps from milliseconds to seconds.
 *
 * @param end - The end timestamp in milliseconds.
 * @param start - The start timestamp in milliseconds.
 * @returns The difference in seconds as a string formatted to three decimal places, followed by ' s'.
 */
const toSeconds = (end: number, start: number) =>
  ((end - start) / 1000).toFixed(3) + ' s';

/**
 * Checks if a binary exists in the system's PATH and returns its path if found.
 *
 * @param binaryName - The name of the binary to check.
 * @returns A promise that resolves to the path of the binary if found, or null if not found within 3 seconds.
 */
const checkBinaryExists = (binaryName: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const ex = exec(`command -v ${binaryName}`, (error, stdout) => {
      if (error) {
        resolve(null);
        return;
      }
      resolve(stdout.trim());
      return;
    });

    setTimeout(() => {
      ex.kill();

      resolve(null);
    }, 3000);
  });
};

program
  .name('html2pdf')
  .description('Convert HTML to PDF')
  .option('-c, --chrome-path <path>', 'Path to Chrome executable')
  .option(
    '-p, --page-format <string>',
    'Letter size, eg: A4, A3, A2, Letter, Legal',
    'legal'
  )
  .option('-t, --timeout <number>', 'Timeout in minutes', '5')
  .argument('input', 'Path to HTML file')
  .argument('output', 'Path to output PDF file')
  .action(async (input, output) => {
    const options = program.opts();
    let chromePath = options.chromePath;
    const timeout = (options.timeout || 5) * 60_000;

    if (!chromePath) {
      chromePath = await checkBinaryExists('google-chrome');
    }

    if (!chromePath) {
      console.error('Chrome executable not found');
      process.exit(1);
    }

    const chromeIsExists = await exists(chromePath);

    if (!chromeIsExists) {
      console.error(`Chrome executable not found at ${chromePath}`);
      process.exit(1);
    }

    const inputFile = Bun.file(input);
    const outputFile = Bun.file(output);

    if (!(await inputFile.exists()) || !inputFile.name) {
      console.error(`Input file ${input} does not exist`);
      process.exit(1);
    }

    try {
      const startTime = performance.now();
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--allow-file-access-from-files',
          '--enable-local-file-accesses',
        ],
        executablePath: chromePath,
      });
      const page = await browser.newPage();
      const browserStartupTime = performance.now();
      const filePath = resolve(inputFile.name);

      if (extname(filePath) === '.html') {
        await page.goto('file://' + filePath, {
          waitUntil: 'networkidle0',
          timeout: timeout,
        });
      } else {
        await page.setContent(await inputFile.text(), {
          waitUntil: 'networkidle0',
          timeout: timeout,
        });
      }



      const pageSetContentTime = performance.now();
      const buffer = await page.pdf({
        format: options.pageFormat,
        margin: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
        timeout: timeout,
      });
      const generatePdfTime = performance.now();

      await inputFile.delete();
      await outputFile.write(buffer);

      const writePdfTime = performance.now();
      await page.close();
      await browser.close();

      const endTime = performance.now();

      console.info('PDF generated successfully');
      console.info('Total Time:', toSeconds(endTime, startTime));
      console.info(
        'Browser Start Time:',
        toSeconds(browserStartupTime, startTime)
      );
      console.info(
        'Page Set Content Time:',
        toSeconds(pageSetContentTime, browserStartupTime)
      );
      console.info(
        'PDF Generation Time:',
        toSeconds(generatePdfTime, pageSetContentTime)
      );
      console.info(
        'Writing PDF to Disk Time:',
        toSeconds(writePdfTime, generatePdfTime)
      );
      console.info('Cleanup Time:', toSeconds(endTime, writePdfTime));
      process.exit(0);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error('Error generating PDF');
      }
      process.exit(1);
    }
  });

program.parse();
