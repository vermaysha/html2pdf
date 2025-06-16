import { readableStreamToArrayBuffer, type BunFile, type S3File } from 'bun';

export type GSPreset = 'screen' | 'ebook' | 'printer' | 'prepress' | 'default';

/**
 * Gets the path to the Ghostscript executable.
 * @returns The path to the Ghostscript executable, or null if it is not installed or not found in PATH.
 */
export const getGhostscript = (): string | null => {
  if (process.platform === 'win32') {
    // Di Windows, nama executable biasanya gswin64c.exe untuk versi command-line
    return Bun.which('gswin64c.exe') || Bun.which('gswin64.exe');
  }
  return Bun.which('gs');
};

/**
 * Compresses a given PDF (Uint8Array) using Ghostscript.
 * @param input - The PDF as a Uint8Array.
 * @param preset - A Ghostscript PDF preset, defaults to 'ebook'.
 * @returns The compressed PDF as a Uint8Array.
 * @throws An error if Ghostscript is not installed or not found in PATH,
 * or if the Ghostscript process exits with a non-zero code.
 */
export async function compressWithGs(
  input: Uint8Array<ArrayBufferLike>,
  preset: GSPreset = 'ebook'
) {
  const gsPath = getGhostscript();
  if (!gsPath) {
    throw new Error('Ghostscript is not installed or not found in PATH.');
  }

  const args = [
    gsPath,
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.4',
    `-dPDFSETTINGS=/${preset}`,
    '-dNOPAUSE',
    '-dQUIET',
    '-dBATCH',
    '-sOutputFile=-',
    '-',
  ];

  const gsProcess = Bun.spawn(args, {
    stdin: input,
    stderr: 'pipe',
  });

  const exitCode = await gsProcess.exited;

  const [stdout, stderr] = await Promise.all([
    readableStreamToArrayBuffer(gsProcess.stdout),
    readableStreamToArrayBuffer(gsProcess.stderr),
  ]);

  if (exitCode === 0) {
    return stdout;
  }

  throw new Error(
    `Ghostscript process exited with code ${exitCode}. Error: ${stderr}`
  );
}
