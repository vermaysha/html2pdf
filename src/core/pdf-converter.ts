import puppeteer, { executablePath } from 'puppeteer-core';
import type { Browser, PDFOptions, PaperFormat } from 'puppeteer-core';
import type { InputSource, OutputFile } from '../types';
import { unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import config from '../config';
import { getExecutablePath } from './browser-finder';

/**
 * @file src/core/pdf-converter.ts
 * @description Core logic for converting HTML to PDF using Puppeteer.
 */

interface ConversionOptions {
  executablePath?: string;
  inputSource: InputSource;
  outputFile: OutputFile;
  timeout: number;
  pageFormat: PaperFormat;
  removeSource: boolean;
}

/**
 * Gets a browser instance. It prioritizes connecting to a running server.
 * If no server is found, it finds a local browser and launches a new temporary instance.
 * @returns A tuple [browser, wasConnected]
 */
async function getBrowserInstance(customPath?: string): Promise<[Browser, boolean]> {
  // Prioritas 1: Mencoba terhubung ke instance bersama.
  try {
    const endpoint = await Bun.file(config.endpointFilePath).text();
    if (endpoint) {
      console.log('Connecting to shared browser instance...');
      const browser = await puppeteer.connect({ browserWSEndpoint: endpoint });
      console.log('✅ Connected.');
      return [browser, true]; // Kembalikan browser dan indikasikan itu adalah koneksi
    }
  } catch (e) {
    // Tidak ada file endpoint atau koneksi gagal, lanjutkan ke fallback.
  }

  // Fallback: Menjalankan instance browser sementara yang baru.
  console.log(
    'No shared instance found. Searching for a browser to launch manually...'
  );
  const executablePath = await getExecutablePath(customPath);
  if (!executablePath) {
    throw new Error(
      'Could not find a browser to launch. Please run "html2pdf browser install" or check your installation.'
    );
  }

  console.log(`Launching a temporary browser from: ${executablePath}`);
  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });
  return [browser, false]; // Kembalikan browser dan indikasikan itu adalah peluncuran baru
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

  // getBrowserInstance sekarang menangani semuanya secara internal.
  const [browser, wasConnected] = await getBrowserInstance(executablePath);
  const page = await browser.newPage();
  console.log('New page created in browser.');

  try {
    // Memuat konten ke dalam halaman
    if (inputSource.type === 'url') {
      console.log(`Navigating to URL: ${inputSource.path}`);
      await page.goto(inputSource.path, { waitUntil: 'networkidle0', timeout });
    } else {
      console.log(`Loading content from file: ${inputSource.file.name}`);
      const content = await inputSource.file.text();
      await page.setContent(content, { waitUntil: 'networkidle0' });
    }
    console.log('Content loaded successfully.');

    // Menghasilkan PDF
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

    // Menulis PDF ke output
    console.log(`Writing PDF to: ${outputFile.name || 'S3 path'}`);
    await outputFile.write(buffer);
    console.log('PDF written successfully.');

    // Secara opsional menghapus file sumber
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
    // Jika kita meluncurkan browser sementara, pastikan browser ditutup saat terjadi error.
    if (!wasConnected) await browser.close();
    process.exit(1);
  } finally {
    console.log('Closing page...');
    await page.close();
    // Hanya tutup browser jika kita meluncurkannya khusus untuk tugas ini.
    // Jika kita terhubung ke instance bersama, biarkan tetap berjalan dengan hanya memutuskan koneksi.
    if (!wasConnected) {
      console.log('Closing temporary browser...');
      await browser.close();
    } else {
      console.log('Disconnecting from shared browser instance.');
      await browser.disconnect();
    }
  }
}
