<div align="center">

  <img src="logo.png" alt="EPUB Studio Logo" width="120" style="border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" />

  <h1>📚 EPUB Studio</h1>

  <p><strong>Next-Gen EPUB Cleaner, WebP Compressor, Volume Splitter & Metadata Suite</strong></p>

  <p>
    <a href="https://github.com/encydu/epub-studio/releases/latest"><img src="https://img.shields.io/github/v/release/encydu/epub-studio?style=for-the-badge&logo=github&color=6366f1" alt="Latest Release" /></a>
    <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Web-0078D4?style=for-the-badge&logo=windows&logoColor=white" alt="Platform" />
    <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python Version" />
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge" alt="MIT License" /></a>
  </p>

  <p>
    <a href="#-download-windows-portable">Download</a> •
    <a href="#-features">Features</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-license">License</a>
  </p>

</div>

---

## 📥 Download (Windows Portable)

No Python or environment setup required! Download the standalone `.exe` and run immediately:

👉 **[Download Latest `EPUB Cleaner.exe`](https://github.com/encydu/epub-studio/releases/latest)**

---

## ✨ Features

### 1. 🧹 Advanced Text & Anti-Scraper Cleaner
- **Zero-Width Space (ZWS) Removal:** Strips invisible Unicode noise (`\u200B`, `\u200C`, `\u200D`, `\uFEFF`, `\u200E`, `\u200F`, `\u202A-\u202E`, `\u2060-\u2064`, `\u00AD`).
- **Hidden Anti-Scraper Honeypot Filtering:** Detects and eliminates hidden elements (`aria-hidden="true"`, `display:none`, `font-size:0`, `opacity:0`, `visibility:hidden`, and off-screen coordinates).
- **Dynamic Attribute Sanitization:** Removes randomized tracking and fingerprint attributes (e.g. `xya="brand"`) while preserving standard HTML5/SVG standards.
- **Custom Ad Regex Rules:** Strips website watermarks, chapter promotions, and domain URLs.
- **Side-by-Side Visual Diff:** Real-time visual comparison of original vs. cleaned HTML content.

### 2. 🖼️ Image Compression & WebP Optimization
- **WebP Converter:** Compresses embedded book images to high-efficiency WebP format with customizable quality (30%–95%).
- **Resolution Downscaler:** Automatically resizes oversized cover and illustration images (e.g. max 800px, 1000px, 1200px, or original).
- **Image Inspector & Lightbox:** Inspect all internal images, check file dimensions, spot unreferenced graphics, and delete unwanted images directly.

### 3. ✂️ Volume Partitioner & Splitter
- Splits massive multi-thousand-chapter web novels into compact, e-reader-friendly volumes based on target megabytes (e.g. 10MB per volume).
- Automatically reorganizes OPF package manifests, NCX tables of contents, and EPUB3 Navigation documents.
- Optional on-the-fly WebP compression during splitting.

### 4. 🏷️ Metadata & Cover Editor
- Modify OPF book metadata: Book Title, Author / Creator, Synopsis / Description, Publisher, and Language code.
- Replace or upload high-resolution book covers (JPEG, PNG, WebP).

### 5. ⚡ Batch Engine & Audit Matrix
- **Bulk Drag-and-Drop:** Queue and process dozens of EPUB files simultaneously.
- **Sequential Queue:** Real-time progress tracking, pause/abort controls, and status badges (*Analyzing, Processing, Done, Failed*).
- **Audit Matrix Table:** Filter by status, search files, retry failures, and export comprehensive audit logs to JSON.
- **Flexible Output Destinations:** Save to source directory (`_cleaned.epub`), custom output folder, or download as a consolidated `.zip` package.

---

## 🚀 Quick Start (Running from Source)

### Prerequisites
- **Python 3.10** or higher
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/encydu/epub-studio.git
cd epub-studio
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Application
```bash
python server.py
```
> This will automatically open the native desktop window (via PyWebView). If PyWebView is not installed, it will automatically launch in your default web browser at `http://127.0.0.1:8899`.

---

## 📦 Building Standalone Executable (.exe)

To package EPUB Studio into a single, portable Windows executable:

```cmd
build.bat
```
The compiled executable will be located in `dist/EPUB Cleaner.exe`.

---

## 🛠️ Tech Stack

- **Backend:** Python 3 (`ThreadingHTTPServer`, `zipfile`, `lxml`, `beautifulsoup4`, `Pillow`)
- **Frontend:** Vanilla HTML5, CSS3 (*Modern Glassmorphism Dark Theme, Plus Jakarta Sans, JetBrains Mono*), Modern ES6+ JavaScript
- **Desktop Runtime:** PyWebView & PyInstaller

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — developed by **[encydu](https://github.com/encydu)**.
