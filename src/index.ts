import puppeteer from 'puppeteer-core';
import { exists } from 'node:fs/promises';
import { $ } from 'bun';
import { program } from 'commander';

program
  .name('html2pdf')
  .description('Convert HTML to PDF')
  .option('-c, --chrome-path <path>', 'Path to Chrome executable')
  .option('-p, --page-format <string>', 'Letter size, eg: A4, A3, A2, Letter, Legal', 'legal')
  .argument('input', 'Path to HTML file')
  .argument('output', 'Path to output PDF file')
  .action(async (input, output) => {
    const options = program.opts();
    const chromePath =
      options.chromePath || (await $`which google-chrome`.text()).trim();
    const chromeIsExists = await exists(chromePath);

    if (!chromeIsExists) {
      console.log(`Chrome executable not found at ${chromePath}`);
      return;
    }

    const inputFile = Bun.file(input);
    const outputFile = Bun.file(output);

    if (!(await inputFile.exists())) {
      console.log(`Input file ${input} does not exist`);
      return;
    }

    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: chromePath,
      });
      const page = await browser.newPage();

      await page.setContent(await inputFile.text(), {
        waitUntil: 'networkidle0',
      });
      const buffer = await page.pdf({
        format: options.pageFormat,
        margin: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        }
      });

      await inputFile.delete();
      await outputFile.write(buffer);
      await page.close();
      await browser.close();

      console.info('PDF generated successfully');
      process.exit(0);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error generating PDF: ' + error.message);
      } else {
        console.error('Error generating PDF');
      }
      process.exit(1);
    }
  });

program.parse();
