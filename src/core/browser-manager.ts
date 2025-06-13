import {
  Browser,
  getInstalledBrowsers,
  install,
  resolveBuildId,
  detectBrowserPlatform,
  BrowserTag,
} from '@puppeteer/browsers';
import { rm } from 'node:fs/promises';
import config from '../config';
import { PUPPETEER_REVISIONS } from 'puppeteer-core/src/revisions.ts';

/**
 * @file src/core/browser-manager.ts
 * @description Core logic for managing local browser installations for Puppeteer.
 */

/**
 * Lists all browsers found in the Puppeteer cache directory.
 */
export async function listInstalledBrowsers(): Promise<void> {
  console.log(`🔍 Searching for browsers in: ${config.cachePath}`);
  try {
    const browsers = await getInstalledBrowsers({ cacheDir: config.cachePath });
    if (browsers.length === 0) {
      console.log('✅ No browsers found in the cache directory.');
      return;
    }

    console.log('✅ Found installed browsers:');
    browsers.forEach((browser) => {
      console.log(`- ${browser.browser} (build: ${browser.buildId})`);
      console.log(`  Path: ${browser.executablePath}`);
    });
  } catch (error) {
    // Gracefully handle if cache directory doesn't exist
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      console.log('✅ Cache directory does not exist. No browsers to list.');
      return;
    }
    console.error('❌ Error listing browsers:', error);
  }
}

/**
 * Clears the entire Puppeteer browser cache directory after confirmation.
 */
export async function clearBrowserCache(): Promise<void> {
  console.warn(
    `⚠️ This will permanently delete all contents of the cache directory:`
  );
  console.warn(`   ${config.cachePath}`);
  console.log('Are you sure you want to continue? (Type "yes" to confirm)');

  for await (const line of console) {
    if (line.trim().toLowerCase() === 'yes') {
      try {
        console.log('⏳ Clearing browser cache...');
        await rm(config.cachePath, { recursive: true, force: true });
        console.log('✅ Browser cache cleared successfully.');
      } catch (error) {
        console.error('❌ Failed to clear browser cache:', error);
      }
      return;
    } else {
      console.log('Operation cancelled.');
      return;
    }
  }
}

/**
 * Downloads and installs the locked version of chrome-headless-shell.
 */
export async function installHeadlessShell(): Promise<void> {
  console.log('⏳ Preparing to install chrome-headless-shell...');
  try {
    const platform = detectBrowserPlatform();
    if (!platform) {
      throw new Error('Could not detect the current platform.');
    }
    const tag = PUPPETEER_REVISIONS['chrome-headless-shell'] ?? 'stable';

    // Use locked version of 'google-headless-shell' from puppeteer-core
    const buildId = await resolveBuildId(
      Browser.CHROMEHEADLESSSHELL,
      platform,
      tag,
    );
    console.log(
      `ℹ️ Chrome headless shell build ID for your platform (${platform}): ${buildId}`
    );

    // Check if this build is already installed
    const installedBrowsers = await getInstalledBrowsers({
      cacheDir: config.cachePath,
    }).catch(() => []);
    const isInstalled = installedBrowsers.some(
      (b) => b.browser === Browser.CHROMEHEADLESSSHELL && b.buildId === buildId
    );

    if (isInstalled) {
      console.log(
        '✅ chrome-headless-shell is already installed and up-to-date.'
      );
      return;
    }

    console.log('📥 Downloading... This might take a few minutes.');
    const browser = await install({
      browser: Browser.CHROMEHEADLESSSHELL,
      buildId: buildId,
      cacheDir: config.cachePath,
      downloadProgressCallback: 'default',
    });

    process.stdout.write('\n'); // Ensure the next console.log starts on a new line
    console.log(
      `✅ Successfully installed ${browser.browser} (build: ${browser.buildId})`
    );
    console.log(`   at: ${browser.executablePath}`);
  } catch (error) {
    console.error('❌ Failed to install browser:', error);
  }
}
