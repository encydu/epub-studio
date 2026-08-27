#!/usr/bin/env python3
"""
EPUB Cleaner Core Engine & CLI
Cleans zero-width characters, hidden anti-scraper containers, dynamic watermark attributes,
and junk promotional text from EPUB files. Preserves OCF EPUB spec standards.
"""

import os
import sys
import re
import zipfile
import argparse
import json
import posixpath
import urllib.parse
import shutil
from collections import Counter
from bs4 import BeautifulSoup

ZWS_PATTERN = re.compile(
    r'[\u200B\u200C\u200D\uFEFF\u200E\u200F\u202A\u202B\u202C\u202D\u202E\u2060\u2061\u2062\u2063\u2064\u00AD]'
)

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

STANDARD_ATTRS = {
    'class', 'style', 'id', 'title', 'lang', 'dir', 'accesskey', 'tabindex', 'hidden',
    'itemprop', 'itemscope', 'itemtype', 'role',
    'xmlns', 'href', 'rel', 'type', 'media', 'target', 'charset', 'name', 'content',
    'http-equiv', 'hreflang', 'sizes', 'srcset',
    'src', 'alt', 'width', 'height', 'align', 'valign', 'loading', 'decoding',
    'poster', 'controls', 'autoplay', 'loop', 'muted', 'preload', 'crossorigin',
    'value', 'placeholder', 'disabled', 'checked', 'selected', 'readonly', 'multiple',
    'autocomplete', 'autofocus', 'rows', 'cols', 'start', 'reversed',
    'colspan', 'rowspan', 'scope', 'headers',
    'viewbox', 'preserveaspectratio', 'd', 'fill', 'stroke', 'stroke-width',
    'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset',
    'stroke-opacity', 'fill-opacity', 'opacity', 'transform', 'cx', 'cy', 'r',
    'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'dx', 'dy', 'points',
    'font-size', 'font-family', 'text-anchor', 'dominant-baseline', 'clip-path',
    'mask', 'vector-effect'
}

DEFAULT_OPTIONS = {
    'clean_zws': True,
    'clean_hidden_elements': True,
    'clean_watermark_attrs': True,
    'clean_custom_regex': True,
    'custom_patterns': [
        r'Read on [A-Za-z0-9\s]+',
        r'Visit [A-Za-z0-9\s\.-]+ for next chapters',
        r'First published on [A-Za-z0-9\s\.-]+'
    ]
}

def is_valid_attr(attr_name):
    """Check if an attribute is a standard HTML/SVG attribute or valid namespace prefix."""
    lower_attr = attr_name.lower()
    if lower_attr in STANDARD_ATTRS:
        return True
    if lower_attr.startswith(('data-', 'aria-', 'xml:', 'xmlns:', 'epub:', 'xlink:')):
        return True
    return False

def count_zws_chars(text):
    """Count total zero-width invisible characters in text."""
    return len(ZWS_PATTERN.findall(text))

def clean_html_content(html_str, options=None):
    """
    Cleans XHTML/HTML content string based on specified options.
    Preserves XML header, DOCTYPE, and XHTML validity.
    Returns (cleaned_html_str, stats_dict).
    """
    if options is None:
        options = DEFAULT_OPTIONS
    else:
        if 'custom_patterns' not in options or not options['custom_patterns']:
            options = dict(options, custom_patterns=DEFAULT_OPTIONS['custom_patterns'])

    stats = {
        'zws_removed': 0,
        'hidden_elements_removed': 0,
        'watermark_attrs_removed': 0,
        'custom_patterns_matched': 0
    }

    xml_decl_match = re.match(r'^\s*<\?xml[^>]*\?>', html_str, re.IGNORECASE)
    xml_decl = xml_decl_match.group(0).strip() if xml_decl_match else None

    doctype_match = re.search(r'<!DOCTYPE[^>]*>', html_str, re.IGNORECASE)
    doctype = doctype_match.group(0).strip() if doctype_match else None

    if options.get('clean_zws', True):
        initial_zws = count_zws_chars(html_str)
        if initial_zws > 0:
            html_str = ZWS_PATTERN.sub('', html_str)
            stats['zws_removed'] = initial_zws

    if options.get('clean_custom_regex', True) and options.get('custom_patterns'):
        for pattern in options['custom_patterns']:
            if not pattern or not pattern.strip():
                continue
            try:
                rx = re.compile(pattern, re.IGNORECASE)
                matches = len(rx.findall(html_str))
                if matches > 0:
                    html_str = rx.sub('', html_str)
                    stats['custom_patterns_matched'] += matches
            except re.error:
                pass

    if options.get('clean_hidden_elements', True) or options.get('clean_watermark_attrs', True):
        try:
            soup = BeautifulSoup(html_str, 'html.parser')

            if options.get('clean_hidden_elements', True):
                hidden_tags = soup.find_all(attrs={"aria-hidden": "true"})
                for tag in hidden_tags:
                    tag.decompose()
                    stats['hidden_elements_removed'] += 1

                hidden_attr_tags = soup.find_all(attrs={"hidden": True})
                for tag in hidden_attr_tags:
                    tag.decompose()
                    stats['hidden_elements_removed'] += 1

                for tag in soup.find_all(style=True):
                    style_val = tag['style'].lower()
                    if ('display:' in style_val and 'none' in style_val) or \
                       ('visibility:' in style_val and 'hidden' in style_val) or \
                       ('font-size:' in style_val and ('0px' in style_val or '0pt' in style_val)) or \
                       ('opacity:' in style_val and '0' in style_val and '0.' not in style_val):
                        tag.decompose()
                        stats['hidden_elements_removed'] += 1

            if options.get('clean_watermark_attrs', True):
                for tag in soup.find_all(True):
                    attrs_to_remove = [
                        attr for attr in list(tag.attrs.keys())
                        if not is_valid_attr(attr)
                    ]
                    for attr in attrs_to_remove:
                        del tag[attr]
                        stats['watermark_attrs_removed'] += 1

            cleaned_html = str(soup)

            cleaned_html = cleaned_html.replace('viewbox="', 'viewBox="').replace('preserveaspectratio="', 'preserveAspectRatio="')

            if xml_decl and not cleaned_html.startswith('<?xml'):
                cleaned_html = f"{xml_decl}\n{cleaned_html}"
            if doctype and doctype not in cleaned_html:
                if xml_decl and cleaned_html.startswith(xml_decl):
                    cleaned_html = cleaned_html.replace(xml_decl, f"{xml_decl}\n{doctype}", 1)
                else:
                    cleaned_html = f"{doctype}\n{cleaned_html}"

            return cleaned_html, stats

        except Exception:
            return html_str, stats

    return html_str, stats

def extract_chapter_title_from_html(html_str, fallback_name=""):
    """Extracts a human-readable title from chapter HTML (h1, h2, title)."""
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', html_str, re.DOTALL | re.IGNORECASE)
    if h1:
        t = re.sub(r'<[^>]+>', '', h1.group(1)).strip()
        t = re.sub(r'\s+', ' ', t)
        if t and len(t) < 120:
            return t
    h2 = re.search(r'<h2[^>]*>(.*?)</h2>', html_str, re.DOTALL | re.IGNORECASE)
    if h2:
        t = re.sub(r'<[^>]+>', '', h2.group(1)).strip()
        t = re.sub(r'\s+', ' ', t)
        if t and len(t) < 120:
            return t
    title = re.search(r'<title[^>]*>(.*?)</title>', html_str, re.DOTALL | re.IGNORECASE)
    if title:
        t = re.sub(r'<[^>]+>', '', title.group(1)).strip()
        t = re.sub(r'\s+', ' ', t)
        if t and len(t) < 120 and t.lower() not in ['untitled', 'unknown', 'title']:
            return t
    return fallback_name

def analyze_epub(epub_path, options=None):
    """
    Performs deep structural scan of an EPUB file.
    Returns detected watermarks, hidden elements, chapters summary,
    and detailed image assets with chapter locations.
    """
    if not os.path.exists(epub_path):
        raise FileNotFoundError(f"File not found: {epub_path}")

    if options is None:
        options = DEFAULT_OPTIONS
    else:
        if 'custom_patterns' not in options or not options['custom_patterns']:
            options = dict(options, custom_patterns=DEFAULT_OPTIONS['custom_patterns'])

    analysis = {
        'file_name': os.path.basename(epub_path),
        'file_size_bytes': os.path.getsize(epub_path),
        'total_files_in_epub': 0,
        'xhtml_chapters_count': 0,
        'total_zws_chars': 0,
        'total_hidden_elements': 0,
        'total_watermark_attrs': 0,
        'chapters_summary': [],
        'images_summary': [],
        'total_images_count': 0,
        'total_images_size_bytes': 0
    }

    with zipfile.ZipFile(epub_path, 'r') as z:
        namelist = z.namelist()
        analysis['total_files_in_epub'] = len(namelist)

        cover_zip_path = None
        opf_file = None
        try:
            container_xml = z.read('META-INF/container.xml').decode('utf-8', errors='ignore')
            opf_match = re.search(r'full-path=["\']([^"\']+)["\']', container_xml, re.IGNORECASE)
            if opf_match:
                opf_file = opf_match.group(1)
        except Exception:
            for f in namelist:
                if f.lower().endswith('.opf'):
                    opf_file = f
                    break

        if opf_file and opf_file in namelist:
            try:
                opf_dir = posixpath.dirname(opf_file)
                opf_str = z.read(opf_file).decode('utf-8', errors='ignore')

                meta_cover = re.search(r'<meta[^>]*name=["\']cover["\'][^>]*content=["\']([^"\']+)["\']', opf_str, re.IGNORECASE)
                if not meta_cover:
                    meta_cover = re.search(r'<meta[^>]*content=["\']([^"\']+)["\'][^>]*name=["\']cover["\']', opf_str, re.IGNORECASE)
                cover_id = meta_cover.group(1) if meta_cover else None

                cover_href = None
                if cover_id:
                    item_match = re.search(r'<item[^>]*id=["\']' + re.escape(cover_id) + r'["\'][^>]*href=["\']([^"\']+)["\']', opf_str, re.IGNORECASE)
                    if item_match:
                        cover_href = item_match.group(1)

                if not cover_href:
                    cover_prop_match = re.search(r'<item[^>]*properties=["\'][^"\']*cover-image[^"\']*["\'][^>]*href=["\']([^"\']+)["\']', opf_str, re.IGNORECASE)
                    if cover_prop_match:
                        cover_href = cover_prop_match.group(1)

                if not cover_href:
                    for item_match in re.finditer(r'<item[^>]*href=["\']([^"\']+)["\']', opf_str, re.IGNORECASE):
                        h = item_match.group(1)
                        if 'cover' in h.lower() and h.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.gif')):
                            cover_href = h
                            break

                if cover_href:
                    cover_href = urllib.parse.unquote(cover_href)
                    cover_zip_path = posixpath.normpath(posixpath.join(opf_dir, cover_href)).lstrip('/')
            except Exception:
                pass

        img_files = [f for f in namelist if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'))]

        xhtml_files = [f for f in namelist if f.lower().endswith(('.xhtml', '.html', '.htm'))]
        analysis['xhtml_chapters_count'] = len(xhtml_files)

        image_chapter_refs = {}
        image_basename_refs = {}

        for idx, filename in enumerate(xhtml_files):
            try:
                raw_bytes = z.read(filename)
                content = raw_bytes.decode('utf-8', errors='ignore')

                zws_count = count_zws_chars(content)
                hidden_count = len(re.findall(r'aria-hidden=["\']true["\']', content, re.IGNORECASE)) + \
                               len(re.findall(r'style=["\'][^"\']*(?:display:\s*none|visibility:\s*hidden|font-size:\s*0px?|font-size:\s*0pt|opacity:\s*0)[^"\']*["\']', content, re.IGNORECASE)) + \
                               len(re.findall(r'<[a-zA-Z0-9_-]+\s+[^>]*\bhidden\b[^>]*>', content, re.IGNORECASE))

                attrs = re.findall(r' ([a-zA-Z0-9_:-]+)=["\']([^"\']*)["\']', content)
                custom_attrs_count = sum(1 for name, _ in attrs if not is_valid_attr(name))

                analysis['total_zws_chars'] += zws_count
                analysis['total_hidden_elements'] += hidden_count
                analysis['total_watermark_attrs'] += custom_attrs_count

                default_name = f"Bab {idx + 1}"
                if 'cover' in filename.lower() or 'titlepage' in filename.lower():
                    default_name = "Cover / Sampul"
                chapter_title = extract_chapter_title_from_html(content, default_name)

                chapter_info = {
                    'index': idx,
                    'title': chapter_title,
                    'filename': filename,
                    'short_name': os.path.basename(filename),
                    'size_bytes': len(raw_bytes),
                    'zws_chars': zws_count,
                    'hidden_elements': hidden_count,
                    'custom_attrs': custom_attrs_count
                }
                analysis['chapters_summary'].append(chapter_info)

                ch_dir = posixpath.dirname(filename)
                img_src_matches = re.findall(r'(?:src|xlink:href|href)=["\']([^"\']+\.(?:jpg|jpeg|png|webp|gif|bmp))["\']', content, re.IGNORECASE)
                css_url_matches = re.findall(r'url\(["\']?([^"\'\)]+\.(?:jpg|jpeg|png|webp|gif|bmp))["\']?\)', content, re.IGNORECASE)

                all_refs = set(img_src_matches + css_url_matches)
                for raw_ref in all_refs:
                    clean_ref = urllib.parse.unquote(raw_ref.split('#')[0].split('?')[0])
                    resolved_path = posixpath.normpath(posixpath.join(ch_dir, clean_ref)).lstrip('/')

                    if resolved_path not in image_chapter_refs:
                        image_chapter_refs[resolved_path] = []
                    image_chapter_refs[resolved_path].append({
                        'index': idx + 1,
                        'name': chapter_title,
                        'file': filename,
                        'short_name': os.path.basename(filename)
                    })

                    base_key = os.path.basename(clean_ref).lower()
                    if base_key not in image_basename_refs:
                        image_basename_refs[base_key] = []
                    image_basename_refs[base_key].append({
                        'index': idx + 1,
                        'name': chapter_title,
                        'file': filename,
                        'short_name': os.path.basename(filename)
                    })

            except Exception:
                pass

        for img_f in img_files:
            try:
                info = z.getinfo(img_f)
                width = None
                height = None
                try:
                    from PIL import Image
                    import io
                    with Image.open(io.BytesIO(z.read(img_f))) as im:
                        width, height = im.size
                except Exception:
                    pass

                norm_img = posixpath.normpath(img_f).lstrip('/')
                base_name = os.path.basename(img_f)
                base_key = base_name.lower()

                is_cover = False
                if cover_zip_path and (norm_img == cover_zip_path or base_key == os.path.basename(cover_zip_path).lower()):
                    is_cover = True
                elif 'cover' in base_key and (len(img_files) == 1 or 'cover' in norm_img.lower()):
                    is_cover = True

                ch_refs = image_chapter_refs.get(norm_img) or image_basename_refs.get(base_key) or []
                seen_ch = set()
                unique_chapters = []
                for c in ch_refs:
                    if c['file'] not in seen_ch:
                        seen_ch.add(c['file'])
                        unique_chapters.append(c)

                is_unused = (len(unique_chapters) == 0 and not is_cover)

                analysis['images_summary'].append({
                    'filename': img_f,
                    'short_name': base_name,
                    'size_bytes': info.file_size,
                    'ext': os.path.splitext(img_f)[1].lower(),
                    'width': width,
                    'height': height,
                    'is_cover': is_cover,
                    'chapters': unique_chapters,
                    'is_unused': is_unused
                })
            except Exception:
                pass

        analysis['total_images_count'] = len(analysis['images_summary'])
        analysis['total_images_size_bytes'] = sum(img['size_bytes'] for img in analysis['images_summary'])

    return analysis

def get_preview_diff(epub_path, chapter_index=0, options=None):
    """
    Extracts a sample chapter from an EPUB and returns BEFORE vs AFTER cleaning snippet.
    """
    with zipfile.ZipFile(epub_path, 'r') as z:
        xhtml_files = [f for f in z.namelist() if f.lower().endswith(('.xhtml', '.html', '.htm'))]
        if not xhtml_files:
            return {"error": "No XHTML files found in EPUB"}
        
        target_file = xhtml_files[min(chapter_index, len(xhtml_files) - 1)]
        raw_content = z.read(target_file).decode('utf-8', errors='ignore')
        
        cleaned_content, stats = clean_html_content(raw_content, options)
        
        return {
            'chapter_filename': target_file,
            'before_html': raw_content,
            'after_html': cleaned_content,
            'stats': stats
        }

def clean_epub(input_path, output_path=None, options=None):
    """
    Cleans an EPUB file and outputs a clean EPUB zip preserving EPUB specifications.
    Returns summary statistics dict.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")

    if options is None:
        options = DEFAULT_OPTIONS

    if output_path is None:
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}_cleaned{ext}"

    total_stats = {
        'input_file': input_path,
        'output_file': output_path,
        'original_size_bytes': os.path.getsize(input_path),
        'cleaned_size_bytes': 0,
        'processed_chapters': 0,
        'zws_removed': 0,
        'hidden_elements_removed': 0,
        'watermark_attrs_removed': 0,
        'custom_patterns_matched': 0
    }

    temp_output = output_path + ".tmp"

    try:
        with zipfile.ZipFile(input_path, 'r') as z_in:
            with zipfile.ZipFile(temp_output, 'w', compression=zipfile.ZIP_DEFLATED) as z_out:
                namelist = z_in.namelist()

                if 'mimetype' in namelist:
                    mimetype_bytes = z_in.read('mimetype')
                    z_out.writestr('mimetype', mimetype_bytes, compress_type=zipfile.ZIP_STORED)

                for item in z_in.infolist():
                    if item.filename == 'mimetype':
                        continue

                    data = z_in.read(item.filename)

                    if item.filename.lower().endswith(('.xhtml', '.html', '.htm')):
                        try:
                            content_str = data.decode('utf-8')
                            cleaned_str, file_stats = clean_html_content(content_str, options)
                            data = cleaned_str.encode('utf-8')

                            total_stats['processed_chapters'] += 1
                            total_stats['zws_removed'] += file_stats['zws_removed']
                            total_stats['hidden_elements_removed'] += file_stats['hidden_elements_removed']
                            total_stats['watermark_attrs_removed'] += file_stats['watermark_attrs_removed']
                            total_stats['custom_patterns_matched'] += file_stats['custom_patterns_matched']

                        except UnicodeDecodeError:
                            pass

                    z_out.writestr(item.filename, data)

        if os.path.exists(output_path):
            os.remove(output_path)
        os.rename(temp_output, output_path)

        total_stats['cleaned_size_bytes'] = os.path.getsize(output_path)
        total_stats['size_difference_bytes'] = total_stats['original_size_bytes'] - total_stats['cleaned_size_bytes']
        total_stats['success'] = True
        return total_stats

    except Exception as e:
        if os.path.exists(temp_output):
            try:
                os.remove(temp_output)
            except OSError:
                pass
        raise e

def analyze_epub_batch(epub_paths, options=None):
    """
    Analyzes multiple EPUB files and returns an aggregated dictionary with
    overall totals and individual per-file analysis entries.
    """
    batch_summary = {
        'total_files': len(epub_paths),
        'total_size_bytes': 0,
        'total_zws_chars': 0,
        'total_hidden_elements': 0,
        'total_watermark_attrs': 0,
        'files': []
    }
    for epub_path in epub_paths:
        try:
            an = analyze_epub(epub_path, options)
            batch_summary['files'].append(an)
            batch_summary['total_size_bytes'] += an.get('file_size_bytes', 0)
            batch_summary['total_zws_chars'] += an.get('total_zws_chars', 0)
            batch_summary['total_hidden_elements'] += an.get('total_hidden_elements', 0)
            batch_summary['total_watermark_attrs'] += an.get('total_watermark_attrs', 0)
        except Exception as e:
            batch_summary['files'].append({
                'file_name': os.path.basename(epub_path),
                'error': str(e)
            })
    return batch_summary

def clean_epub_batch(epub_paths, output_dir=None, options=None):
    """
    Cleans multiple EPUB files and places cleaned outputs into output_dir.
    Returns aggregated stats and per-file results.
    """
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    batch_result = {
        'total_files': len(epub_paths),
        'successful_files': 0,
        'failed_files': 0,
        'total_original_size_bytes': 0,
        'total_cleaned_size_bytes': 0,
        'total_zws_removed': 0,
        'total_hidden_elements_removed': 0,
        'total_watermark_attrs_removed': 0,
        'results': []
    }

    for epub_path in epub_paths:
        if not os.path.exists(epub_path):
            batch_result['failed_files'] += 1
            batch_result['results'].append({
                'input_file': epub_path,
                'success': False,
                'error': 'File not found'
            })
            continue

        filename = os.path.basename(epub_path)
        if output_dir:
            out_file = os.path.join(output_dir, filename)
        else:
            base, ext = os.path.splitext(epub_path)
            out_file = f"{base}_cleaned{ext}"

        try:
            res = clean_epub(epub_path, out_file, options)
            batch_result['successful_files'] += 1
            batch_result['total_original_size_bytes'] += res.get('original_size_bytes', 0)
            batch_result['total_cleaned_size_bytes'] += res.get('cleaned_size_bytes', 0)
            batch_result['total_zws_removed'] += res.get('zws_removed', 0)
            batch_result['total_hidden_elements_removed'] += res.get('hidden_elements_removed', 0)
            batch_result['total_watermark_attrs_removed'] += res.get('watermark_attrs_removed', 0)
            batch_result['results'].append(res)
        except Exception as e:
            batch_result['failed_files'] += 1
            batch_result['results'].append({
                'input_file': epub_path,
                'output_file': out_file,
                'success': False,
                'error': str(e)
            })

    batch_result['size_difference_bytes'] = batch_result['total_original_size_bytes'] - batch_result['total_cleaned_size_bytes']
    return batch_result

def delete_epub_images(epub_path, target_images, output_path=None):
    """
    Deletes specified images from an EPUB file.
    Cleans up:
      1. Physical image assets in ZIP
      2. <item> declarations in OPF manifest
      3. <img> / <image> HTML elements in XHTML chapters
    """
    if not os.path.exists(epub_path):
        raise FileNotFoundError(f"EPUB file not found: {epub_path}")

    if not target_images:
        return {'status': 'ok', 'deleted_count': 0, 'analysis': analyze_epub(epub_path)}

    target_norm_set = set(posixpath.normpath(img).lstrip('/') for img in target_images)
    target_base_set = set(os.path.basename(img).lower() for img in target_images)

    orig_size = os.path.getsize(epub_path)
    is_inplace = (output_path is None or os.path.abspath(output_path) == os.path.abspath(epub_path))
    temp_output = epub_path + ".del.tmp" if is_inplace else output_path

    deleted_count = 0
    with zipfile.ZipFile(epub_path, 'r') as z_in:
        with zipfile.ZipFile(temp_output, 'w', compression=zipfile.ZIP_DEFLATED) as z_out:
            namelist = z_in.namelist()

            if 'mimetype' in namelist:
                z_out.writestr('mimetype', z_in.read('mimetype'), compress_type=zipfile.ZIP_STORED)

            for item in z_in.infolist():
                if item.filename == 'mimetype':
                    continue

                norm_filename = posixpath.normpath(item.filename).lstrip('/')
                base_name_lower = os.path.basename(item.filename).lower()

                if norm_filename in target_norm_set or base_name_lower in target_base_set:
                    deleted_count += 1
                    continue

                raw_data = z_in.read(item.filename)

                if item.filename.lower().endswith('.opf'):
                    try:
                        opf_str = raw_data.decode('utf-8', errors='ignore')
                        for base in target_base_set:
                            opf_str = re.sub(r'<item[^>]*href=["\'][^"\']*' + re.escape(base) + r'[^"\']*["\'][^>]*/>\s*', '', opf_str, flags=re.IGNORECASE)
                            opf_str = re.sub(r'<item[^>]*href=["\'][^"\']*' + re.escape(base) + r'[^"\']*["\'][^>]*>.*?</item>\s*', '', opf_str, flags=re.IGNORECASE | re.DOTALL)
                        raw_data = opf_str.encode('utf-8')
                    except Exception:
                        pass

                elif item.filename.lower().endswith(('.xhtml', '.html', '.htm')):
                    try:
                        html_str = raw_data.decode('utf-8', errors='ignore')
                        has_change = False
                        for base in target_base_set:
                            if base in html_str.lower():
                                has_change = True
                                html_str = re.sub(r'<img[^>]*src=["\'][^"\']*' + re.escape(base) + r'[^"\']*["\'][^>]*\/?>', '', html_str, flags=re.IGNORECASE)
                                html_str = re.sub(r'<image[^>]*xlink:href=["\'][^"\']*' + re.escape(base) + r'[^"\']*["\'][^>]*\/?>', '', html_str, flags=re.IGNORECASE)
                                html_str = re.sub(r'<image[^>]*href=["\'][^"\']*' + re.escape(base) + r'[^"\']*["\'][^>]*\/?>', '', html_str, flags=re.IGNORECASE)

                        if has_change:
                            html_str = re.sub(r'<svg[^>]*>\s*</svg>', '', html_str, flags=re.IGNORECASE)
                            html_str = re.sub(r'<div[^>]*>\s*</div>', '', html_str, flags=re.IGNORECASE)
                            html_str = re.sub(r'<p[^>]*>\s*</p>', '', html_str, flags=re.IGNORECASE)
                            raw_data = html_str.encode('utf-8')
                    except Exception:
                        pass

                z_out.writestr(item.filename, raw_data)

    if is_inplace:
        shutil.move(temp_output, epub_path)
        final_path = epub_path
    else:
        final_path = output_path

    new_size = os.path.getsize(final_path)
    fresh_analysis = analyze_epub(final_path)

    return {
        'status': 'ok',
        'deleted_count': deleted_count,
        'deleted_images': list(target_images),
        'file_path': final_path,
        'file_size_before': orig_size,
        'file_size_after': new_size,
        'saved_bytes': max(0, orig_size - new_size),
        'analysis': fresh_analysis
    }

def main():
    parser = argparse.ArgumentParser(description="EPUB Cleaner - Remove ZWS, hidden tags, and watermarks.")
    parser.add_argument("input", help="Path to input EPUB file or directory containing EPUBs")
    parser.add_argument("-o", "--output", help="Path to output cleaned EPUB file or directory")
    parser.add_argument("--no-zws", action="store_true", help="Disable zero-width space removal")
    parser.add_argument("--no-hidden", action="store_true", help="Disable hidden elements removal")
    parser.add_argument("--no-attrs", action="store_true", help="Disable watermark attributes removal")
    parser.add_argument("--analyze", action="store_true", help="Analyze EPUB without saving cleaned output")
    parser.add_argument("--json", action="store_true", help="Output results in JSON format")

    args = parser.parse_args()

    options = {
        'clean_zws': not args.no_zws,
        'clean_hidden_elements': not args.no_hidden,
        'clean_watermark_attrs': not args.no_attrs,
        'clean_custom_regex': True
    }

    if args.analyze:
        analysis = analyze_epub(args.input, options)
        if args.json:
            print(json.dumps(analysis, indent=2))
        else:
            print(f"\n--- EPUB Analysis for: {analysis['file_name']} ---")
            print(f"File Size: {analysis['file_size_bytes'] / 1024:.1f} KB")
            print(f"Total XHTML Chapters: {analysis['xhtml_chapters_count']}")
            print(f"Zero-Width Characters Found: {analysis['total_zws_chars']}")
            print(f"Hidden Elements Found: {analysis['total_hidden_elements']}")
            print(f"Custom Watermark Attributes Found: {analysis['total_watermark_attrs']}")
        return

    if os.path.isfile(args.input):
        result = clean_epub(args.input, args.output, options)
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print(f"\n✅ Successfully cleaned: {result['input_file']}")
            print(f"   Output saved to: {result['output_file']}")
            print(f"   Original Size: {result['original_size_bytes'] / 1024:.1f} KB -> Cleaned: {result['cleaned_size_bytes'] / 1024:.1f} KB")
            print(f"   Chapters Processed: {result['processed_chapters']}")
            print(f"   ZWS Characters Removed: {result['zws_removed']}")
            print(f"   Hidden Elements Stripped: {result['hidden_elements_removed']}")
            print(f"   Watermark Attributes Cleaned: {result['watermark_attrs_removed']}\n")

    elif os.path.isdir(args.input):
        output_dir = args.output if args.output else os.path.join(args.input, "cleaned_epubs")
        os.makedirs(output_dir, exist_ok=True)
        
        epubs = [os.path.join(args.input, f) for f in os.listdir(args.input) if f.lower().endswith('.epub')]
        print(f"Found {len(epubs)} EPUB files to clean in directory...\n")
        
        batch_results = []
        for epub_path in epubs:
            out_file = os.path.join(output_dir, os.path.basename(epub_path))
            try:
                res = clean_epub(epub_path, out_file, options)
                batch_results.append(res)
                print(f"Cleaned {os.path.basename(epub_path)}: ZWS Removed: {res['zws_removed']}, Hidden: {res['hidden_elements_removed']}")
            except Exception as e:
                print(f"Failed {os.path.basename(epub_path)}: {e}")
                
        if args.json:
            print(json.dumps(batch_results, indent=2))

if __name__ == "__main__":
    main()
