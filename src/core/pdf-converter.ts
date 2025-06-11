import puppeteer from 'puppeteer-core';
import type { PDFOptions, PaperFormat } from 'puppeteer-core';
import type { InputSource, OutputFile } from '../types';
import { unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';

/**
 * @file src/core/pdf-converter.ts
 * @description Core logic for converting HTML to PDF using Puppeteer.
 */

interface ConversionOptions {
  executablePath: string;
  inputSource: InputSource;
  outputFile: OutputFile;
  timeout: number;
  pageFormat: PaperFormat;
  removeSource: boolean;
}

export async function convertToPdf(options: ConversionOptions): Promise<void> {
  const {
    executablePath,
    inputSource,
    outputFile,
    timeout,
    pageFormat,
    removeSource,
  } = options;

  console.log('Launching browser...');
  const userDataDir = resolve(tmpdir(), `html2pdf-${Bun.randomUUIDv7()}`);
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      // Required for running as root in many environments.
      '--no-sandbox',
      '--disable-setuid-sandbox',

      // Mitigates issues with shared memory in Docker.
      '--disable-dev-shm-usage',

      // Disables GPU hardware acceleration, which can cause issues in virtual environments.
      '--disable-gpu',
      '--disable-software-rasterizer',

      // Specifies a writable directory for the user profile to prevent permission errors.
      // This directly addresses 'cannot create directory /root' errors.
      `--user-data-dir=${userDataDir}`,

      // Prevents some hanging issues by running in a single process.
      '--single-process',

      // Disables the Zygote process, often needed with --no-sandbox on Linux.
      '--no-zygote',

      // Allows file access from files, useful for local HTML with local assets.
      '--allow-file-access-from-files',
      '--enable-local-file-accesses',

      // Ignores certificate errors for HTTPS sites.
      '--ignore-certificate-errors',
    ],
    userDataDir: userDataDir,
    acceptInsecureCerts: true,
    executablePath,
  });

  const page = await browser.newPage();
  console.log('Browser launched, new page created.');

  try {
    // Load content into the page
    if (inputSource.type === 'url') {
      console.log(`Navigating to URL: ${inputSource.path}`);
      await page.goto(inputSource.path, { waitUntil: 'networkidle0', timeout });
    } else {
      console.log(`Loading content from file: ${inputSource.file.name}`);
      const content = await inputSource.file.text();
      await page.setContent(content, { waitUntil: 'networkidle0' });
    }
    console.log('Content loaded successfully.');

    // Generate PDF
    const pdfOptions: PDFOptions = {
      format: pageFormat,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
      timeout,
    };

    console.log('Generating PDF...');
    const buffer = await page.pdf(pdfOptions);
    console.log(
      `PDF generated with size: ${(buffer.length / 1024).toFixed(2)} KB`
    );

    // Write PDF to output
    console.log(`Writing PDF to: ${outputFile.name || 'S3 path'}`);
    await outputFile.write(buffer);
    console.log('PDF written successfully.');

    // Optionally remove source file
    if (removeSource && inputSource.type === 'file' && !inputSource.isUrl) {
      console.log(`Removing source file: ${inputSource.path}`);
      await unlink(inputSource.path);
      console.log('Source file removed.');
    }
  } catch (error) {
    console.error(
      '❌ An error occurred during the PDF conversion process:',
      error
    );
    process.exit(1);
  } finally {
    // Ensure browser is closed
    console.log('Closing browser...');
    await page.close();
    await browser.close();
    console.log('Browser closed.');
  }
}
