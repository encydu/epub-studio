# 📚 EPUB Studio (EPUB Cleaner & Optimizer)

An all-in-one, ultra-fast web and desktop application designed to clean, compress, split, edit metadata, and batch-process EPUB files. Built with a modern dark glassmorphism interface and multithreaded Python backend.

Developed by **[encydu](https://github.com/encydu)**.

---

## ✨ Features

### 1. 🧹 Advanced Text & Anti-Scraper Cleaner
- **Zero-Width Space (ZWS) Removal:** Strips invisible Unicode characters (`\u200B`, `\u200C`, `\u200D`, `\uFEFF`, `\u200E`, `\u200F`, `\u202A-\u202E`, `\u2060-\u2064`, `\u00AD`).
- **Hidden Element Filtering:** Removes anti-scraper honey pots (`aria-hidden="true"`, `display:none`, `font-size:0`, `opacity:0`, `visibility:hidden`, `position:absolute` off-screen text).
- **Dynamic Attribute Sanitization:** Strips randomized tracking attributes (e.g. `xya="brand"`) while preserving standard HTML5/SVG specifications.
- **Custom Ad Regex Filtering:** Removes chapter watermarks, promotional site advertisements, and custom ad regex patterns.
- **Live Side-by-Side Visual Diff:** Inspect original HTML vs. cleaned output with real-time highlighted changes before exporting.

### 2. 🖼️ Image Compression & WebP Optimization
- **WebP Converter:** Compresses internal images to high-efficiency WebP format with custom quality control (30%–95%).
- **Resolution Scaling:** Resizes high-res images to configurable maximum dimensions (800px, 1000px, 1200px, or original).
- **Image Inspector & Lightbox:** View all internal book images, inspect dimensions, identify unreferenced/unused images, and delete unwanted graphics directly from the EPUB.

### 3. ✂️ Volume Partitioner & Splitter
- Split massive multi-thousand-chapter light novels into smaller, e-reader-friendly volumes based on target megabytes (e.g., 10MB per volume).
- Automatically re-indexes OPF package manifests, NCX tables of contents, and nav documents.
- Optional auto-compression to WebP during the splitting process.

### 4. 🏷️ Metadata & Cover Editor
- Modify OPF book metadata: Title, Creator / Author, Synopsis / Description, Publisher, and Language code.
- Replace or upload high-resolution book covers (JPG, PNG, WebP).

### 5. ⚡ Real-Time Sequential Batch Engine & Audit Matrix
- **Bulk Drag-and-Drop & Recursive Directory Scan:** Process dozens of EPUB files simultaneously.
- **Granular Queue:** Real-time progress bar, pause/abort controller (`AbortController`), and per-item status badges (*Pending, Analyzing, Processing, Done, Failed*).
- **Batch Matrix Table:** Search files, filter by status, retry failed files, and export full audit reports to JSON.
- **Flexible Export:** Save output to application folder, source directory (`_cleaned.epub`), custom directory, or download as a consolidated `.zip` archive.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10 or higher
- Pillow (`pip install Pillow`)
- BeautifulSoup4 (`pip install beautifulsoup4`)
- lxml (`pip install lxml`)

### Installation
```bash
git clone https://github.com/encydu/epub-cleaner.git
cd epub-cleaner
pip install -r requirements.txt # or pip install Pillow beautifulsoup4 lxml pywebview
```

### Running the Web Interface
```bash
python server.py
```
Open your browser and navigate to **[http://127.0.0.1:8899](http://127.0.0.1:8899)**.

### Running as Desktop GUI App
```bash
python app_desktop.py
```

### Building Windows Standalone Executable (.exe)
```cmd
build_app.bat
```

---

## 🛠️ Tech Stack
- **Backend:** Python 3 (ThreadingHTTPServer, ZipFile, lxml, BeautifulSoup4, PIL)
- **Frontend:** Vanilla HTML5, CSS3 (Modern Glassmorphism Dark Theme, Plus Jakarta Sans & JetBrains Mono), Vanilla JavaScript (ES6+)
- **Desktop Runtime:** PyWebView

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
