import { program } from '@commander-js/extra-typings';
import { configureCommands } from './cli/commands';

/**
 * @file src/index.ts
 * @description Main entry point for the html2pdf CLI application.
 *
 * This file initializes the commander program, configures the commands and options,
 * and parses the command-line arguments to execute the application.
 */

// Configure the main program details
program
  .name('html2pdf')
  .description('A robust CLI tool to convert HTML content (from file, URL, or S3) to PDF.');

// Attach commands and their actions to the program
configureCommands(program);

// Parse the arguments from the process
program.parse(process.argv);
