import { platform, arch } from 'node:os';
import { rename, chmod } from 'node:fs/promises';
import { compareVersions } from '../utils/version-compare';
import config from '../config';

// Import version from package.json
import { version as currentVersion } from '../../package.json';

/**
 * @file src/core/self-updater.ts
 * @description Core logic for the self-upgrade command.
 */
function getAssetName(): string {
  const os = platform();
  const cpuArch = arch();

  let assetName = 'html2pdf-';
  switch (os) {
    case 'linux':
      assetName += 'linux-';
      break;
    case 'win32':
      assetName += 'windows-';
      break;
    case 'darwin':
      assetName += 'darwin-'; // macOS
      break;
    default:
      throw new Error(`Unsupported operating system: ${os}`);
  }

  switch (cpuArch) {
    case 'x64':
      assetName += 'x86';
      break;
    case 'arm64':
      assetName += 'arm64';
      break;
    default:
      throw new Error(`Unsupported architecture: ${cpuArch}`);
  }

  if (os === 'win32') {
    assetName += '.exe';
  }

  return assetName;
}

/**
 * Checks for the latest release of the application on GitHub and updates the
 * current binary if a newer version is available. It fetches the release data
 * from the repository, compares the latest version with the current version,
 * and downloads the appropriate binary for the user's platform and architecture
 * if an update is necessary. The function replaces the existing executable with
 * the newly downloaded version, ensuring the application is up-to-date.
 *
 * Logs the update process and handles errors, exiting the process if the update
 * fails.
 */
export async function runSelfUpdate(): Promise<void> {
  console.log(`Current version: ${currentVersion}`);
  console.log('Checking for updates...');

  try {
    const { owner, repo } = config.githubRepo;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': 'html2pdf-cli-updater' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch latest release: ${response.statusText}`);
    }

    const releaseData = await response.json() as any;
    const latestVersion = releaseData.tag_name.replace('v', '');

    if (compareVersions(latestVersion, currentVersion) <= 0) {
      console.log('✅ You are already on the latest version.');
      return;
    }

    console.log(`New version available: ${latestVersion}. Downloading...`);

    const assetName = getAssetName();
    const asset = releaseData.assets.find((a: any) => a.name === assetName);

    if (!asset) {
      throw new Error(`Could not find a release asset for your platform and architecture: ${assetName}`);
    }

    const downloadUrl = asset.browser_download_url;
    const downloadResponse = await fetch(downloadUrl);
    const newBinary = await downloadResponse.arrayBuffer();

    const currentExecutablePath = process.execPath;
    const tempExecutablePath = `${currentExecutablePath}.tmp`;

    // Write new binary to a temporary file
    await Bun.write(tempExecutablePath, newBinary);
    await chmod(tempExecutablePath, 0o7_5_5);

    // Replace the old binary with the new one
    await rename(tempExecutablePath, currentExecutablePath);

    console.info(`✅ Successfully updated to version ${latestVersion}!`);

  } catch (error) {
    console.error('❌ Update failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
