import { getInstalledBrowsers } from '@puppeteer/browsers';
import { platform } from 'node:os';
import { join } from 'node:path';
import { which } from 'bun';
import config from '../config';
import { compareVersions } from '../utils/version-compare';
import type { BrowserPath } from '../types';

/**
 * @file src/core/browser-finder.ts
 * @description Logic for finding the executable path of Chrome or Chromium.
 */

async function findSystemBrowser(browserName: 'Chrome' | 'Chromium'): Promise<BrowserPath> {
  const os = platform();

  switch (os) {
    case 'darwin': { // macOS
      const macPath = browserName === 'Chrome'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : '/Applications/Chromium.app/Contents/MacOS/Chromium';
      return (await Bun.file(macPath).exists()) ? macPath : null;
    }

    case 'linux': {
      const commands = browserName === 'Chrome'
        ? ['google-chrome-stable', 'google-chrome']
        : ['chromium-browser', 'chromium'];
      for (const cmd of commands) {
        const path = which(cmd);
        if (path) return path;
      }
      return null;
    }

    case 'win32': { // Windows
      const prefixes = [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA].filter(Boolean) as string[];
      const suffix = join('Google', 'Chrome', 'Application', 'chrome.exe'); // Chromium often uses the same path structure on Windows
      for (const prefix of prefixes) {
        const fullPath = join(prefix, suffix);
        if (await Bun.file(fullPath).exists()) return fullPath;
      }
      return null;
    }

    default:
      return null;
  }
}

async function findHeadlessShell(): Promise<BrowserPath> {
  try {
    const browsers = await getInstalledBrowsers({ cacheDir: config.cachePath });
    const headlessShells = browsers.filter(b => b.browser === 'chrome-headless-shell');

    if (headlessShells.length === 0) return null;
    if (headlessShells.length === 1) return headlessShells[0]?.executablePath ?? null;

    // Sort by version and return the latest
    headlessShells.sort((a, b) => compareVersions(b.buildId, a.buildId));
    return headlessShells[0]?.executablePath ?? null;
  } catch {
    return null; // Ignore errors if cache dir doesn't exist etc.
  }
}

export async function getExecutablePath(customPath?: string): Promise<BrowserPath> {
  if (customPath) {
    console.log(`Using custom browser path: ${customPath}`);
    return customPath;
  }

  console.log('Searching for browser executable...');

  // Priority:
  // 1. Installed headless shell (via puppeteer)
  // 2. System Chromium
  // 3. System Chrome

  const headlessPath = await findHeadlessShell();
  if (headlessPath) {
    console.log(`Found installed headless shell: ${headlessPath}`);
    return headlessPath;
  }

  const chromiumPath = await findSystemBrowser('Chromium');
  if (chromiumPath) {
    console.log(`Found system Chromium: ${chromiumPath}`);
    return chromiumPath;
  }

  const chromePath = await findSystemBrowser('Chrome');
  if (chromePath) {
    console.log(`Found system Chrome: ${chromePath}`);
    return chromePath;
  }

  return null;
}
