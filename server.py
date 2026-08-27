#!/usr/bin/env python3
"""
EPUB Cleaner Web Backend & API Server
Serves static web files and REST endpoints for EPUB analysis, previewing, and cleaning.
"""

import os
import sys
import json
import glob
import zipfile
import base64
import urllib.parse
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import epub_cleaner
import epub_splitter
import epub_metadata

PORT = 8899
HOST = '127.0.0.1'
STATIC_DIR = os.path.dirname(os.path.abspath(__file__))


def find_all_epubs(paths_or_dirs):
    """
    Recursively scans provided paths or directories to locate all valid .epub files.
    Excludes temporary directories and already cleaned/compressed files.
    """
    found = []
    for p in paths_or_dirs:
        if not p:
            continue
        p = os.path.abspath(p)
        if os.path.isfile(p):
            if p.lower().endswith('.epub'):
                found.append(p)
        elif os.path.isdir(p):
            for root, dirs, files in os.walk(p):
                dirs[:] = [d for d in dirs if not d.startswith('.') and d.lower() not in [
                    'cleaned_batch', 'compressed_batch', 'temp', 'tmp', '__pycache__', 'node_modules', 'dist', 'build'
                ]]
                for f in files:
                    if f.lower().endswith('.epub') and not f.lower().endswith(('_cleaned.epub', '_compressed.epub', '_meta.epub')):
                        found.append(os.path.join(root, f))

    seen = set()
    result = []
    for f in found:
        norm = os.path.normpath(f)
        if norm not in seen:
            seen.add(norm)
            result.append(f)
    return result


def resolve_output_file(input_path, output_mode='uploads', custom_dir=None, suffix='_cleaned'):
    """
    Resolves the destination filepath based on output_mode:
      - 'uploads': saves in STATIC_DIR/uploads/<type>_batch/<filename>
      - 'same_dir': saves in the same folder as input_path with specified suffix
      - 'custom_dir': saves inside custom_dir with the original filename
    """
    filename = os.path.basename(input_path)
    base_name, ext = os.path.splitext(filename)

    if output_mode == 'same_dir':
        dir_name = os.path.dirname(os.path.abspath(input_path))
        return os.path.join(dir_name, f"{base_name}{suffix}{ext}")
    elif output_mode == 'custom_dir' and custom_dir:
        abs_custom = os.path.abspath(custom_dir)
        os.makedirs(abs_custom, exist_ok=True)
        return os.path.join(abs_custom, filename)
    else:  # 'uploads' (default)
        subdir = 'cleaned_batch' if 'clean' in suffix else ('compressed_batch' if 'compress' in suffix else 'metadata_batch')
        target_dir = os.path.join(STATIC_DIR, 'uploads', subdir)
        os.makedirs(target_dir, exist_ok=True)
        return os.path.join(target_dir, filename)


class EPUBCleanerHandler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        # Quiet logger for clean console output
        sys.stdout.write(f"[{self.log_date_time_string()}] {format % args}\n")

    def _set_headers(self, status=200, content_type='application/json'):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query = urllib.parse.parse_qs(parsed_url.query)

        # Serve static files
        if path == '/' or path == '/index.html':
            self._serve_file(os.path.join(STATIC_DIR, 'index.html'), 'text/html; charset=utf-8')
            return
        elif path == '/style.css':
            self._serve_file(os.path.join(STATIC_DIR, 'style.css'), 'text/css; charset=utf-8')
            return
        elif path == '/app.js':
            self._serve_file(os.path.join(STATIC_DIR, 'app.js'), 'application/javascript; charset=utf-8')
            return
        elif path == '/logo.png' or path == '/favicon.png' or path == '/favicon.ico':
            self._serve_file(os.path.join(STATIC_DIR, 'logo.png'), 'image/png')
            return

        # API: Scan Downloads folder for EPUBs
        elif path == '/api/scan-downloads':
            downloads_path = os.path.join(os.path.expanduser('~'), 'Downloads')
            epubs = []
            if os.path.exists(downloads_path):
                for f in os.listdir(downloads_path):
                    if f.lower().endswith('.epub') and not f.lower().endswith(('_cleaned.epub', '_compressed.epub')):
                        full_path = os.path.join(downloads_path, f)
                        try:
                            size_bytes = os.path.getsize(full_path)
                            epubs.append({
                                'name': f,
                                'path': full_path,
                                'size_kb': round(size_bytes / 1024, 1)
                            })
                        except Exception:
                            pass
            self._set_headers(200)
            self.wfile.write(json.dumps({'status': 'ok', 'epubs': epubs}).encode('utf-8'))
            return

        # API: Download cleaned / compressed file
        elif path == '/api/download':
            file_path = query.get('file', [''])[0]
            if file_path:
                abs_path = os.path.abspath(file_path)
                # Allow downloading any local .epub or .zip that exists
                is_safe = os.path.exists(abs_path) and os.path.isfile(abs_path) and abs_path.lower().endswith(('.epub', '.zip'))

                if is_safe:
                    filename = os.path.basename(abs_path)
                    mime_type = 'application/zip' if abs_path.lower().endswith('.zip') else 'application/epub+zip'
                    self.send_response(200)
                    self.send_header('Content-Type', mime_type)
                    self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
                    self.send_header('Content-Length', str(os.path.getsize(abs_path)))
                    self.end_headers()
                    with open(abs_path, 'rb') as f:
                        self.wfile.write(f.read())
                    return

            self._set_headers(404)
            self.wfile.write(json.dumps({'error': 'File not found or access denied'}).encode('utf-8'))
            return

        # API: Image Preview Stream from EPUB
        elif path == '/api/image-preview':
            epub_path = query.get('path', [''])[0]
            img_name = query.get('image', [''])[0]
            if epub_path and img_name and os.path.exists(epub_path) and os.path.isfile(epub_path):
                try:
                    with zipfile.ZipFile(epub_path, 'r') as z:
                        target_file = None
                        if img_name in z.namelist():
                            target_file = img_name
                        else:
                            img_clean = urllib.parse.unquote(img_name).replace('\\', '/').strip('/')
                            for f in z.namelist():
                                if f == img_clean or f.lower() == img_clean.lower() or os.path.basename(f).lower() == os.path.basename(img_clean).lower():
                                    target_file = f
                                    break
                        if target_file:
                            raw_data = z.read(target_file)
                            ext = os.path.splitext(target_file)[1].lower()
                            mime_types = {
                                '.jpg': 'image/jpeg',
                                '.jpeg': 'image/jpeg',
                                '.png': 'image/png',
                                '.webp': 'image/webp',
                                '.gif': 'image/gif',
                                '.bmp': 'image/bmp',
                                '.svg': 'image/svg+xml'
                            }
                            content_type = mime_types.get(ext, 'image/jpeg')
                            self.send_response(200)
                            self.send_header('Content-Type', content_type)
                            self.send_header('Content-Length', str(len(raw_data)))
                            self.send_header('Cache-Control', 'public, max-age=86400')
                            self.send_header('Access-Control-Allow-Origin', '*')
                            self.end_headers()
                            self.wfile.write(raw_data)
                            return
                except Exception:
                    pass

            self._set_headers(404, 'text/plain')
            self.wfile.write(b'Image not found')
            return

        else:
            self._set_headers(404, 'text/plain')
            self.wfile.write(b'Not Found')

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        content_length = int(self.headers.get('Content-Length', 0))

        # API: Upload File (Drag and Drop)
        if path == '/api/upload':
            raw_filename = self.headers.get('X-Filename', 'uploaded.epub')
            filename = os.path.basename(urllib.parse.unquote(raw_filename))
            if not filename or not filename.lower().endswith('.epub'):
                filename = 'uploaded.epub'

            uploads_dir = os.path.join(STATIC_DIR, 'uploads')
            os.makedirs(uploads_dir, exist_ok=True)
            save_path = os.path.join(uploads_dir, filename)

            # Read stream in 64KB chunks to prevent socket blocking/hanging
            remaining = content_length
            with open(save_path, 'wb') as f:
                while remaining > 0:
                    chunk_size = min(remaining, 65536)
                    chunk = self.rfile.read(chunk_size)
                    if not chunk:
                        break
                    f.write(chunk)
                    remaining -= len(chunk)

            self._set_headers(200)
            self.wfile.write(json.dumps({'status': 'ok', 'filename': filename, 'path': save_path}).encode('utf-8'))
            return

        # Read JSON body for other endpoints
        body_bytes = b''
        remaining = content_length
        while remaining > 0:
            chunk = self.rfile.read(min(remaining, 65536))
            if not chunk:
                break
            body_bytes += chunk
            remaining -= len(chunk)

        try:
            req_data = json.loads(body_bytes.decode('utf-8')) if body_bytes else {}
        except Exception:
            req_data = {}

        # API: Analyze EPUB
        if path == '/api/analyze':
            epub_path = req_data.get('path')
            if not epub_path or not os.path.exists(epub_path):
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'Invalid or non-existent file path'}).encode('utf-8'))
                return
            try:
                options = req_data.get('options')
                analysis = epub_cleaner.analyze_epub(epub_path, options)
                self._set_headers(200)
                self.wfile.write(json.dumps({'status': 'ok', 'analysis': analysis}).encode('utf-8'))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        # API: Preview Chapter Diff
        elif path == '/api/preview':
            epub_path = req_data.get('path')
            chapter_index = req_data.get('chapter_index', 0)
            options = req_data.get('options')
            if not epub_path or not os.path.exists(epub_path):
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'Invalid file path'}).encode('utf-8'))
                return
            try:
                preview = epub_cleaner.get_preview_diff(epub_path, chapter_index, options)
                self._set_headers(200)
                self.wfile.write(json.dumps({'status': 'ok', 'preview': preview}).encode('utf-8'))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        # API: Clean Single EPUB
        elif path == '/api/clean':
            epub_path = req_data.get('path')
            output_path = req_data.get('output_path')
            output_mode = req_data.get('output_mode', 'uploads')
            custom_dir = req_data.get('output_dir')
            options = req_data.get('options')

            if not epub_path or not os.path.exists(epub_path):
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'Invalid file path'}).encode('utf-8'))
                return

            if not output_path:
                output_path = resolve_output_file(epub_path, output_mode, custom_dir, suffix='_cleaned')

            try:
                result = epub_cleaner.clean_epub(epub_path, output_path, options)
                self._set_headers(200)
                self.wfile.write(json.dumps({'status': 'ok', 'result': result}).encode('utf-8'))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        # API: Analyze EPUB Batch (Recursive folder support)
        elif path == '/api/analyze-batch':
            paths = req_data.get('paths', [])
            single_path = req_data.get('path')
            if single_path and not paths:
                paths = [single_path]

            expanded_paths = find_all_epubs(paths)
            if not expanded_paths:
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'No valid EPUB files found'}).encode('utf-8'))
                return
            try:
                options = req_data.get('options')
                batch_analysis = epub_cleaner.analyze_epub_batch(expanded_paths, options)
                self._set_headers(200)
                self.wfile.write(json.dumps({'status': 'ok', 'batch_analysis': batch_analysis}).encode('utf-8'))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        # API: Clean EPUB Batch
        elif path == '/api/clean-batch':
            paths = req_data.get('paths', [])
            single_path = req_data.get('path')
            if single_path and not paths:
                paths = [single_path]

            expanded_paths = find_all_epubs(paths)
            if not expanded_paths:
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'No valid EPUB files found to clean'}).encode('utf-8'))
                return

            output_mode = req_data.get('output_mode', 'uploads')
            custom_dir = req_data.get('output_dir')
            options = req_data.get('options')

            results = []
            successful = 0
            failed = 0
            total_orig_size = 0
            total_cleaned_size = 0
            total_zws = 0
            total_hidden = 0
            total_attrs = 0

            for ep in expanded_paths:
                out_file = resolve_output_file(ep, output_mode, custom_dir, suffix='_cleaned')
                try:
                    res = epub_cleaner.clean_epub(ep, out_file, options)
                    successful += 1
                    total_orig_size += res.get('original_size_bytes', 0)
                    total_cleaned_size += res.get('cleaned_size_bytes', 0)
                    total_zws += res.get('zws_removed', 0)
                    total_hidden += res.get('hidden_elements_removed', 0)
                    total_attrs += res.get('watermark_attrs_removed', 0)
                    results.append(res)
                except Exception as e:
                    failed += 1
                    results.append({
                        'input_file': ep,
                        'output_file': out_file,
                        'success': False,
                        'error': str(e)
                    })

            batch_res = {
                'total_files': len(expanded_paths),
                'successful_files': successful,
                'failed_files': failed,
                'total_original_size_bytes': total_orig_size,
                'total_cleaned_size_bytes': total_cleaned_size,
                'size_difference_bytes': total_orig_size - total_cleaned_size,
                'total_zws_removed': total_zws,
                'total_hidden_elements_removed': total_hidden,
                'total_watermark_attrs_removed': total_attrs,
                'results': results
            }
            self._set_headers(200)
            self.wfile.write(json.dumps({'status': 'ok', 'result': batch_res}).encode('utf-8'))
            return

        # API: Compress EPUB Batch
        elif path == '/api/compress-batch':
            paths = req_data.get('paths', [])
            single_path = req_data.get('path')
            if single_path and not paths:
                paths = [single_path]

            expanded_paths = find_all_epubs(paths)
            if not expanded_paths:
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'No valid EPUB files found to compress'}).encode('utf-8'))
                return

            webp_quality = req_data.get('webp_quality', 75)
            max_image_res = req_data.get('max_image_res', 1000)
            output_mode = req_data.get('output_mode', 'uploads')
            custom_dir = req_data.get('output_dir')

            results = []
            successful = 0
            failed = 0
            total_orig_size = 0
            total_comp_size = 0
            total_images_comp = 0

            for ep in expanded_paths:
                out_file = resolve_output_file(ep, output_mode, custom_dir, suffix='_compressed')
                try:
                    res = epub_splitter.compress_epub_images(
                        input_path=ep,
                        output_path=out_file,
                        webp_quality=webp_quality,
                        max_image_res=max_image_res
                    )
                    results.append(res)
                    successful += 1
                    total_orig_size += res.get('original_size_bytes', 0)
                    total_comp_size += res.get('compressed_size_bytes', 0)
                    total_images_comp += res.get('images_compressed', 0)
                except Exception as e:
                    failed += 1
                    results.append({
                        'input_file': ep,
                        'output_file': out_file,
                        'success': False,
                        'error': str(e)
                    })

            batch_res = {
                'total_files': len(expanded_paths),
                'successful_files': successful,
                'failed_files': failed,
                'total_original_size_bytes': total_orig_size,
                'total_compressed_size_bytes': total_comp_size,
                'size_difference_bytes': total_orig_size - total_comp_size,
                'total_images_compressed': total_images_comp,
                'results': results
            }
            self._set_headers(200)
            self.wfile.write(json.dumps({'status': 'ok', 'result': batch_res}).encode('utf-8'))
            return

        # API: Update EPUB Metadata Batch
        elif path == '/api/metadata/update-batch':
            paths = req_data.get('paths', [])
            single_path = req_data.get('path')
            if single_path and not paths:
                paths = [single_path]

            expanded_paths = find_all_epubs(paths)
            if not expanded_paths:
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'No valid EPUB files found'}).encode('utf-8'))
                return

            metadata = req_data.get('metadata', {})
            output_mode = req_data.get('output_mode', 'uploads')
            custom_dir = req_data.get('output_dir')

            results = []
            successful = 0
            failed = 0

            for ep in expanded_paths:
                out_file = resolve_output_file(ep, output_mode, custom_dir, suffix='_meta')
                try:
                    res = epub_metadata.update_epub_metadata(
                        input_path=ep,
                        output_path=out_file,
                        new_meta=metadata
                    )
                    results.append(res)
                    successful += 1
                except Exception as e:
                    failed += 1
                    results.append({
                        'input_file': ep,
                        'output_file': out_file,
                        'success': False,
                        'error': str(e)
                    })

            batch_res = {
                'total_files': len(expanded_paths),
                'successful_files': successful,
                'failed_files': failed,
                'results': results
            }
            self._set_headers(200)
            self.wfile.write(json.dumps({'status': 'ok', 'result': batch_res}).encode('utf-8'))
            return

        # API: Open Folder in native OS File Explorer
        elif path == '/api/open-folder':
            target_path = req_data.get('path')
            if not target_path:
                target_path = os.path.join(STATIC_DIR, 'uploads', 'cleaned_batch')

            abs_target = os.path.abspath(target_path)
            if os.path.isfile(abs_target):
                abs_target = os.path.dirname(abs_target)

            if not os.path.exists(abs_target):
                os.makedirs(abs_target, exist_ok=True)

            try:
                if sys.platform == 'win32':
                    os.startfile(abs_target)
                elif sys.platform == 'darwin':
                    import subprocess
                    subprocess.Popen(['open', abs_target])
                else:
                    import subprocess
                    subprocess.Popen(['xdg-open', abs_target])
                self._set_headers(200)
                self.wfile.write(json.dumps({'status': 'ok', 'opened': abs_target}).encode('utf-8'))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        # API: Package Cleaned Batch into ZIP
        elif path == '/api/download-zip':
            files = req_data.get('files', [])
            if not files:
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'No files provided for zip download'}).encode('utf-8'))
                return

            uploads_dir = os.path.join(STATIC_DIR, 'uploads')
            os.makedirs(uploads_dir, exist_ok=True)
            zip_filename = 'processed_epubs_batch.zip'
            zip_path = os.path.join(uploads_dir, zip_filename)

            try:
                with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as z:
                    for f_path in files:
                        if os.path.exists(f_path) and os.path.isfile(f_path):
                            z.write(f_path, os.path.basename(f_path))

                self._set_headers(200)
                self.wfile.write(json.dumps({'status': 'ok', 'zip_path': zip_path, 'filename': zip_filename}).encode('utf-8'))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        # API: Get EPUB Metadata & Cover
        elif path == '/api/metadata/get':
            epub_path = req_data.get('path')
            if not epub_path or not os.path.exists(epub_path):
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'Invalid file path'}).encode('utf-8'))
                return
            try:
                metadata = epub_metadata.get_epub_metadata(epub_path)
                self._set_headers(200)
                self.wfile.write(json.dumps({'status': 'ok', 'metadata': metadata}).encode('utf-8'))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        # API: Update EPUB Metadata & Cover
        elif path == '/api/metadata/update':
            epub_path = req_data.get('path')
            output_path = req_data.get('output_path')
            output_mode = req_data.get('output_mode', 'uploads')
            custom_dir = req_data.get('output_dir')
            metadata = req_data.get('metadata', {})
            cover_b64 = req_data.get('cover_b64')
            cover_ext = req_data.get('cover_ext', 'jpg')

            if not epub_path or not os.path.exists(epub_path):
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'Invalid file path'}).encode('utf-8'))
                return

            if not output_path:
                output_path = resolve_output_file(epub_path, output_mode, custom_dir, suffix='_meta')

            cover_bytes = None
            if cover_b64:
                try:
                    if ',' in cover_b64:
                        cover_b64 = cover_b64.split(',', 1)[1]
                    cover_bytes = base64.b64decode(cover_b64)
                except Exception as e:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({'error': f'Invalid cover image base64: {e}'}).encode('utf-8'))
                    return

            try:
                res = epub_metadata.update_epub_metadata(
                    input_path=epub_path,
                    output_path=output_path,
                    new_meta=metadata,
                    new_cover_bytes=cover_bytes,
                    new_cover_ext=cover_ext
                )
                self._set_headers(200)
                self.wfile.write(json.dumps({'status': 'ok', 'result': res}).encode('utf-8'))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        # API: Delete Images from EPUB
        elif path == '/api/image/delete':
            epub_path = req_data.get('path')
            images_to_delete = req_data.get('images', [])
            output_path = req_data.get('output_path')

            if not epub_path or not os.path.exists(epub_path):
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'Invalid file path'}).encode('utf-8'))
                return

            if not images_to_delete:
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'No images specified to delete'}).encode('utf-8'))
                return

            try:
                result = epub_cleaner.delete_epub_images(epub_path, images_to_delete, output_path)
                self._set_headers(200)
                self.wfile.write(json.dumps({'status': 'ok', 'result': result}).encode('utf-8'))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        # API: Compress EPUB Images
        elif path == '/api/compress':
            epub_path = req_data.get('path')
            webp_quality = req_data.get('webp_quality', 75)
            max_image_res = req_data.get('max_image_res', 1000)
            output_mode = req_data.get('output_mode', 'uploads')
            custom_dir = req_data.get('output_dir')
            output_path = req_data.get('output_path')

            if not epub_path or not os.path.exists(epub_path):
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'Invalid file path'}).encode('utf-8'))
                return

            if not output_path:
                output_path = resolve_output_file(epub_path, output_mode, custom_dir, suffix='_compressed')

            try:
                result = epub_splitter.compress_epub_images(
                    input_path=epub_path,
                    output_path=output_path,
                    webp_quality=webp_quality,
                    max_image_res=max_image_res
                )
                self._set_headers(200)
                self.wfile.write(json.dumps({'status': 'ok', 'result': result}).encode('utf-8'))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        # API: Split EPUB into Volumes
        elif path == '/api/split':
            epub_path = req_data.get('path')
            max_size_mb = req_data.get('max_size_mb', 10)
            use_webp = req_data.get('use_webp', True)
            webp_quality = req_data.get('webp_quality', 75)
            max_image_res = req_data.get('max_image_res', 1000)
            output_dir = req_data.get('output_dir')

            if not epub_path or not os.path.exists(epub_path):
                self._set_headers(400)
                self.wfile.write(json.dumps({'error': 'Invalid file path'}).encode('utf-8'))
                return

            try:
                parts = epub_splitter.split_epub_file(
                    input_path=epub_path,
                    max_size_mb=max_size_mb,
                    output_dir=output_dir,
                    use_webp=use_webp,
                    webp_quality=webp_quality,
                    max_image_res=max_image_res
                )
                self._set_headers(200)
                self.wfile.write(json.dumps({'status': 'ok', 'parts': parts}).encode('utf-8'))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({'error': 'Endpoint not found'}).encode('utf-8'))

    def _serve_file(self, file_path, content_type):
        if os.path.exists(file_path):
            self._set_headers(200, content_type)
            with open(file_path, 'rb') as f:
                self.wfile.write(f.read())
        else:
            self._set_headers(404, 'text/plain')
            self.wfile.write(b'File Not Found')


def run_server():
    server_address = (HOST, PORT)
    httpd = ThreadingHTTPServer(server_address, EPUBCleanerHandler)
    print(f"🚀 EPUB Cleaner Server running at http://{HOST}:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()


if __name__ == '__main__':
    run_server()
