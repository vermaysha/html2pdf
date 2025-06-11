import { Command } from '@commander-js/extra-typings';
import { listInstalledBrowsers, clearBrowserCache, installHeadlessShell } from '../core/browser-manager';
import config from '../config';

/**
 * @file src/cli/browser-commands.ts
 * @description Creates and configures the 'browser' subcommand and its own subcommands.
 */

export function createBrowserCommand(): Command {
    // Create the main 'browser' command
    const browserCommand = new Command('browser')
        .description('Manage local browsers used for PDF conversion');

    // Attach 'list' subcommand
    browserCommand
        .command('list')
        .description('List all locally installed browsers managed by Puppeteer')
        .action(listInstalledBrowsers);

    // Attach 'clear' subcommand
    browserCommand
        .command('clear')
        .description(`Clear the browser cache directory (located at ${config.cachePath})`)
        .action(clearBrowserCache);

    // Attach 'install' subcommand
    browserCommand
        .command('install')
        .description('Download and install the latest version of chrome-headless-shell')
        .action(installHeadlessShell);

    return browserCommand;
}
