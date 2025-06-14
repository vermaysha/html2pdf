import { $ } from 'bun';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const home = (await $`echo ~`.text().catch(() => process.cwd())).trim();
const configFile = `${home}/.html2pdf`;
const cachePath = resolve(home, '.cache', 'puppeteer');
const githubRepo = {
  owner: 'vermaysha',
  repo: 'html2pdf',
};
const userDataDir = resolve(tmpdir(), `html2pdf-${Bun.randomUUIDv7()}`);
const endpointFilePath = join(homedir(), '.cache', 'puppeteer', 'html2pdf-endpoint.ws');
const browserArgs = [
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
];

export default {
  home,
  configFile,
  cachePath,
  githubRepo,
  browserArgs,
  userDataDir,
  endpointFilePath,
};
