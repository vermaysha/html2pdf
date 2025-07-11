# HTML to PDF Converter CLI

A reliable and efficient command-line tool to convert HTML files or web pages into PDF documents. Built with Bun, TypeScript, and Puppeteer, this tool supports input from local files, URLs, and even Amazon S3 Compatible, and includes integrated browser management features.

---

## ✨ Key Features

- **Flexible Conversion**: Convert HTML from various sources:
  - **Local Files**: Absolute or relative paths.
  - **URLs**: Web addresses with `http://` or `https://` protocols.
  - **Amazon S3 Compatible**: Access files directly from an S3 bucket using `s3://`.
- **Versatile Output**: Save the resulting PDF to a local directory or upload it directly to S3.
- **Browser Management**:
  - **`list`**: Display a list of browsers (chrome-headless-shell) installed in the Puppeteer cache.
  - **`install`**: Automatically download and install the latest version of `chrome-headless-shell`.
  - **`clear`**: Delete the entire browser cache to save space.
- **Customizable Output**: Set the page format (A4, Letter, etc.) and a timeout for the conversion process.
- **High Efficiency**: Runs browser searching and I/O handling in parallel to speed up execution time.
- **Type-Safe**: Built entirely with TypeScript for safer, more maintainable code.

---

## 🛠️ Installation

Download the pre-compiled binary for your operating system from the [**latest release**](https://github.com/vermaysha/html2pdf/releases/latest/).

### For Linux & macOS

1.  **Download the binary** for your architecture (e.g., x64, arm64).
    ```bash
    # Replace 'html2pdf-linux-x86' with the correct file for your OS/architecture
    curl -LO https://github.com/vermaysha/html2pdf/releases/latest/download/html2pdf-linux-x86
    ```

2.  **Make the binary executable.**
    ```bash
    chmod +x ./html2pdf-linux-x86
    ```

3.  **Move it to a directory in your PATH** for global access. We recommend renaming it to `html2pdf`.
    ```bash
    sudo mv ./html2pdf-linux-x86 /usr/local/bin/html2pdf
    ```

4.  **Verify the installation.**
    ```bash
    html2pdf --help
    ```

### For Windows

1.  **Download the executable** (`.exe`) for your architecture from the [**latest release**](https://github.com/vermaysha/html2pdf/releases/latest/). You can do this through your browser or with PowerShell.
    ```powershell
    # Replace 'html2pdf-windows-x86.exe' with the correct file for your architecture
    $url = "https://github.com/vermaysha/html2pdf/releases/latest/download/html2pdf-windows-x86.exe"
    $output = ".\html2pdf.exe"
    Invoke-WebRequest -Uri $url -OutFile $output
    ```

2.  **Move `html2pdf.exe`** to a folder of your choice (e.g., `C:\Program Files\html2pdf`).

3.  **Add that folder to your system's PATH** environment variable to run the command from anywhere.
    - Search for "Edit the system environment variables" in the Start Menu.
    - Click "Environment Variables...".
    - Under "System variables", find and select the `Path` variable, then click "Edit".
    - Click "New" and add the path to the folder where you placed `html2pdf.exe` (e.g., `C:\Program Files\html2pdf`).
    - Click OK on all windows.

4.  **Verify the installation** by opening a new Command Prompt or PowerShell window.
    ```cmd
    html2pdf --help
    ```

---

## Usage

This tool has two main commands: the default conversion command and the `browser` management command.

### 1. Convert HTML to PDF

**Syntax:**
```bash
html2pdf [input] [output] [options]
```

**Examples:**

- **From a local file to a local file:**
  ```bash
  html2pdf ./pages/report.html ./output/report.pdf
  ```

- **From a URL to a local file:**
  ```bash
  html2pdf https://google.com ./output/website.pdf
  ```

- **From a URL to a S3 Compatible:**
  ```bash
  html2pdf https://google.com s3://YOUR_BUCKET/output.pdf --s3-access-key-id YOUR_ACCESS_KEY_ID --s3-secret-access-key YOUR_ACCESS_KEY --s3-endpoint YOUR_ENDPOINT
  ```

- **From a S3 Compatible to a S3 Compatible:**
  ```bash
  html2pdf s3://YOUR_BUCKET/input.html s3://YOUR_BUCKET/output.pdf --s3-access-key-id YOUR_ACCESS_KEY_ID --s3-secret-access-key YOUR_ACCESS_KEY --s3-endpoint YOUR_ENDPOINT
  ```

- **Using Options:**
  ```bash
  html2pdf input.html output.pdf --page-format A4 --timeout 10
  ```

**Available Options:**

| Option                           | Description                                                    | Default                |
| :------------------------------- | :------------------------------------------------------------- | :--------------------- |
| `-c, --chrome-path <path>`       | Specific path to the Chrome/Chromium executable.               | Auto-detect            |
| `-p, --page-format <format>`     | PDF page format. Choices: `A4`, `A3`, `A2`, `Letter`, `Legal`. | `Legal`                |
| `-t, --timeout <number>`         | Timeout (in minutes) for the rendering and conversion process. | `5`                    |
| `-d, --remove-source`            | Delete the source file after a successful conversion.          | `false`                |
| `--s3-access-key-id <value>`     | S3 access key.                                                 | `S3_ACCESS_KEY_ID`     |
| `--s3-secret-access-key <value>` | S3 secret key.                                                 | `S3_SECRET_ACCESS_KEY` |
| `--s3-region <value>`            | S3 region.                                                     | `S3_REGION`            |
| `--s3-endpoint <value>`          | S3 endpoint URL.                                               | `S3_ENDPOINT`          |


### 2. Browser Management

Use the `browser` subcommand to manage local browser installations used by Puppeteer.

**Syntax:**
```bash
html2pdf browser <sub-command>
```

- **List installed browsers:**
  ```bash
  html2pdf browser list
  ```

- **Install the stable `chrome-headless-shell`:**
  ```bash
  html2pdf browser install
  ```

- **Clear the browser cache:**
  ```bash
  html2pdf browser clear
  ```

---

### 3. Upgrade to the latest version

To upgrade to the latest version, run the following command:
```bash
html2pdf self-upgrade
```

This will download the latest version of the application and overwrite the current version. It is recommended to run this command before using the application to ensure you have the latest version.

## 🧑‍💻 Building from Source

If you prefer to build the project from source, you will need **Bun**.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/vermaysha/html2pdf.git
    cd html2pdf
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

3.  **Run the application:**
    ```bash
    bun run src/index.ts --help
    ```

## LICENSE

Copyright © 2025 Ashary Vermaysha

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
