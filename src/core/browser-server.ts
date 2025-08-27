import puppeteer from 'puppeteer-core';
import { getExecutablePath } from './browser-finder';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { stat } from 'node:fs/promises';
import config from '../config';
import { rmSync } from 'node:fs';

/**
 * @file src/core/browser-server.ts
 * @description Manages a persistent, shared browser instance.
 */

/**
 * Starts a persistent browser instance and saves its WebSocket endpoint.
 */
export async function startBrowserServer(): Promise<void> {
  // Check if a server is already running
  try {
    await stat(config.endpointFilePath);
    console.log('✅ A browser instance is already running.');
    const endpoint = await Bun.file(config.endpointFilePath).text();
    console.log(`   Endpoint: ${endpoint}`);
    return;
  } catch (e) {
    // File doesn't exist, which is good. We can start a new server.
  }

  console.log('Starting a new shared browser instance...');
  const executablePath = await getExecutablePath();
  if (!executablePath) {
    throw new Error('Could not find a Chrome/Chromium executable to start.');
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    protocolTimeout: 90_0000, // 15 menit
    args: config.browserArgs,
    // userDataDir: config.userDataDir,
  });

  const endpoint = browser.wsEndpoint();
  await Bun.write(config.endpointFilePath, endpoint);

  console.log('✅ Browser instance started successfully.');
  console.log(`   Endpoint saved to: ${config.endpointFilePath}`);
  console.log('This process will keep running. Press Ctrl+C to stop it, or use "html2pdf browser stop".');

  // --- FIX: Graceful shutdown handler ---
  // Handles Ctrl+C on the 'start' process.
  // It now only handles its own resources and doesn't call the 'stop' command.
  const gracefulShutdown = async () => {
    console.log('\nGracefully shutting down shared browser instance...');
    // No need to call browser.close() if it's already disconnected
    if (browser.connected) {
        await browser.close();
    }
    // Clean up the endpoint file regardless
    try {
        rmSync(config.endpointFilePath);
    } catch (e) { /* ignore if already deleted */ }
    console.log('✅ Cleanup complete.');
    process.exit(0);
  };

  process.on('SIGINT', gracefulShutdown); // Ctrl+C
  process.on('SIGTERM', gracefulShutdown); // Kill command
  process.on('exit', () => {
    try {
      rmSync(config.endpointFilePath);
    } catch (e) { /* ignore */ }
  })

  // --- FIX: Handle unexpected disconnects ---
  // This makes the server more robust if the browser crashes.
  browser.on('disconnected', gracefulShutdown);
  browser.on('disconnected', () => {
    console.warn('⚠️ Shared browser instance was disconnected unexpectedly. Cleaning up...');
    try {
        // Synchronously try to remove the file as the process is about to exit.
        rmSync(config.endpointFilePath);
    } catch (e) { /* ignore */ }
    process.exit(1);
  });
}

/**
 * Stops the persistent browser instance by closing it and deleting the endpoint file.
 */
export async function stopBrowserServer(): Promise<void> {
  try {
    const endpoint = await Bun.file(config.endpointFilePath).text();
    console.log('Connecting to running browser to shut it down...');
    const browser = await puppeteer.connect({ browserWSEndpoint: endpoint });
    await browser.close();
    console.log('Browser instance closed.');
  } catch (error) {
    console.log('No active browser instance found or could not connect. Cleaning up...');
  } finally {
    // Ensure the endpoint file is removed
    try {
        rmSync(config.endpointFilePath);
    } catch (e) {
        // Ignore error if file doesn't exist
    }
    console.log('✅ Cleanup complete.');
  }
}
