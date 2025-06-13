import { $ } from 'bun';
import { resolve } from 'node:path';

const home = (await $`echo ~`.text().catch(() => process.cwd())).trim();
const configFile = `${home}/.html2pdf`;
const cachePath = resolve(home, '.cache', 'puppeteer');
const githubRepo = {
  owner: 'vermaysha',
  repo: 'html2pdf',
};

export default {
  home,
  configFile,
  cachePath,
  githubRepo,
};
