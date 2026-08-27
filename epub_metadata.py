#!/usr/bin/env python3
"""
EPUB Metadata & Cover Editor Module
Reads and updates EPUB package OPF metadata (Title, Author, Description, Publisher, Language)
and replaces internal book cover image while maintaining OCF EPUB spec standards.
"""

import os
import sys
import re
import zipfile
import base64
import urllib.parse
import xml.etree.ElementTree as ET

NAMESPACES = {
    'container': 'urn:oasis:names:tc:opendocument:xmlns:container',
    'opf': 'http://www.idpf.org/2007/opf',
    'dc': 'http://purl.org/dc/elements/1.1/',
    'ncx': 'http://www.daisy.org/z3986/2005/ncx/',
    'xhtml': 'http://www.w3.org/1999/xhtml'
}

for prefix, uri in NAMESPACES.items():
    ET.register_namespace(prefix, uri)


def _get_opf_path(z):
    """Find the main .opf manifest file path inside EPUB zip."""
    try:
        container_bytes = z.read('META-INF/container.xml')
        root = ET.fromstring(container_bytes)
        rootfile = root.find('.//{urn:oasis:names:tc:opendocument:xmlns:container}rootfile')
        if rootfile is not None and 'full-path' in rootfile.attrib:
            return rootfile.attrib['full-path']
    except Exception:
        pass

    for f in z.namelist():
        if f.lower().endswith('.opf'):
            return f
    return 'content.opf'


def get_epub_metadata(epub_path):
    """
    Extracts metadata dictionary and base64 cover preview from an EPUB file.
    Returns dict { title, creator, description, publisher, language, cover_b64, cover_ext, opf_path }.
    """
    if not os.path.exists(epub_path):
        raise FileNotFoundError(f"File not found: {epub_path}")

    metadata = {
        'file_name': os.path.basename(epub_path),
        'title': '',
        'creator': '',
        'description': '',
        'publisher': '',
        'language': 'id',
        'cover_b64': None,
        'cover_ext': 'jpg',
        'cover_filename': ''
    }

    with zipfile.ZipFile(epub_path, 'r') as z:
        opf_path = _get_opf_path(z)
        metadata['opf_path'] = opf_path
        opf_dir = os.path.dirname(opf_path)

        try:
            opf_bytes = z.read(opf_path)
            opf_str = opf_bytes.decode('utf-8', errors='ignore')

            # Standard regex extraction fallback for reliability
            def extract_tag(tag_name):
                m = re.search(r'<dc:' + tag_name + r'[^>]*>(.*?)</dc:' + tag_name + r'>', opf_str, re.DOTALL | re.IGNORECASE)
                if m:
                    # Clean inner HTML tags if present
                    val = re.sub(r'<[^>]+>', '', m.group(1)).strip()
                    return val
                return ''

            metadata['title'] = extract_tag('title') or os.path.splitext(os.path.basename(epub_path))[0]
            metadata['creator'] = extract_tag('creator')
            metadata['description'] = extract_tag('description')
            metadata['publisher'] = extract_tag('publisher')
            metadata['language'] = extract_tag('language') or 'id'

            # Find cover image path in manifest
            cover_file_path = None
            
            # Method 1: <meta name="cover" content="cover-id"/>
            meta_cover_match = re.search(r'<meta[^>]*name=["\']cover["\'][^>]*content=["\']([^"\']+)["\']', opf_str, re.IGNORECASE)
            if not meta_cover_match:
                meta_cover_match = re.search(r'<meta[^>]*content=["\']([^"\']+)["\'][^>]*name=["\']cover["\']', opf_str, re.IGNORECASE)

            cover_id = meta_cover_match.group(1) if meta_cover_match else None

            if cover_id:
                item_match = re.search(r'<item[^>]*id=["\']' + re.escape(cover_id) + r'["\'][^>]*href=["\']([^"\']+)["\']', opf_str, re.IGNORECASE)
                if item_match:
                    cover_file_path = item_match.group(1)

            # Method 2: item with properties="cover-image"
            if not cover_file_path:
                cover_prop_match = re.search(r'<item[^>]*properties=["\'][^"\']*cover-image[^"\']*["\'][^>]*href=["\']([^"\']+)["\']', opf_str, re.IGNORECASE)
                if cover_prop_match:
                    cover_file_path = cover_prop_match.group(1)

            # Method 3: item id="cover" or filename contains cover
            if not cover_file_path:
                for item_match in re.finditer(r'<item[^>]*href=["\']([^"\']+)["\']', opf_str, re.IGNORECASE):
                    href = item_match.group(1)
                    if 'cover' in href.lower() and href.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.gif')):
                        cover_file_path = href
                        break

            # Resolve relative cover file path
            if cover_file_path:
                cover_file_path = urllib.parse.unquote(cover_file_path)
                if opf_dir:
                    full_cover_zip = f"{opf_dir}/{cover_file_path}".replace('//', '/')
                else:
                    full_cover_zip = cover_file_path

                if full_cover_zip in z.namelist():
                    img_data = z.read(full_cover_zip)
                    ext = os.path.splitext(full_cover_zip)[1].lower().replace('.', '') or 'jpg'
                    if ext == 'jpeg':
                        ext = 'jpg'
                    mime = 'image/png' if ext == 'png' else ('image/webp' if ext == 'webp' else 'image/jpeg')
                    b64_str = base64.b64encode(img_data).decode('ascii')
                    metadata['cover_b64'] = f"data:{mime};base64,{b64_str}"
                    metadata['cover_ext'] = ext
                    metadata['cover_filename'] = os.path.basename(full_cover_zip)
                    metadata['cover_zip_path'] = full_cover_zip

        except Exception as e:
            metadata['error'] = str(e)

    return metadata


def update_epub_metadata(input_path, output_path=None, new_meta=None, new_cover_bytes=None, new_cover_ext='jpg'):
    """
    Updates EPUB metadata tags and optional cover image file.
    Returns dict summarizing the updated metadata and saved file size.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")

    if output_path is None:
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}_updated{ext}"

    if new_meta is None:
        new_meta = {}

    temp_output = output_path + ".tmp"

    try:
        with zipfile.ZipFile(input_path, 'r') as z_in:
            opf_path = _get_opf_path(z_in)
            opf_dir = os.path.dirname(opf_path)
            opf_bytes = z_in.read(opf_path)
            opf_str = opf_bytes.decode('utf-8', errors='ignore')

            # Update Metadata in OPF String using regex tag substitution
            def replace_or_add_dc_tag(xml_s, tag, new_val):
                if new_val is None:
                    return xml_s
                # Escape xml special characters
                clean_val = str(new_val).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                pattern = r'<dc:' + tag + r'[^>]*>.*?</dc:' + tag + r'>'
                if re.search(pattern, xml_s, re.DOTALL | re.IGNORECASE):
                    return re.sub(pattern, f'<dc:{tag}>{clean_val}</dc:{tag}>', xml_s, flags=re.DOTALL | re.IGNORECASE)
                else:
                    # Insert before </metadata>
                    meta_end = re.search(r'</(?:[a-zA-Z0-9_:-]+:)?metadata>', xml_s, re.IGNORECASE)
                    if meta_end:
                        pos = meta_end.start()
                        return xml_s[:pos] + f'  <dc:{tag}>{clean_val}</dc:{tag}>\n' + xml_s[pos:]
                return xml_s

            if 'title' in new_meta and new_meta['title']:
                opf_str = replace_or_add_dc_tag(opf_str, 'title', new_meta['title'])
            if 'creator' in new_meta and new_meta['creator'] is not None:
                opf_str = replace_or_add_dc_tag(opf_str, 'creator', new_meta['creator'])
            if 'description' in new_meta and new_meta['description'] is not None:
                opf_str = replace_or_add_dc_tag(opf_str, 'description', new_meta['description'])
            if 'publisher' in new_meta and new_meta['publisher'] is not None:
                opf_str = replace_or_add_dc_tag(opf_str, 'publisher', new_meta['publisher'])
            if 'language' in new_meta and new_meta['language']:
                opf_str = replace_or_add_dc_tag(opf_str, 'language', new_meta['language'])

            # Target cover file path in zip container
            target_cover_zip_path = None
            if new_cover_bytes:
                # Find existing cover zip path
                meta_cover_match = re.search(r'<meta[^>]*name=["\']cover["\'][^>]*content=["\']([^"\']+)["\']', opf_str, re.IGNORECASE)
                if not meta_cover_match:
                    meta_cover_match = re.search(r'<meta[^>]*content=["\']([^"\']+)["\'][^>]*name=["\']cover["\']', opf_str, re.IGNORECASE)

                cover_id = meta_cover_match.group(1) if meta_cover_match else None
                if cover_id:
                    item_match = re.search(r'<item[^>]*id=["\']' + re.escape(cover_id) + r'["\'][^>]*href=["\']([^"\']+)["\']', opf_str, re.IGNORECASE)
                    if item_match:
                        target_cover_zip_path = item_match.group(1)

                if not target_cover_zip_path:
                    cover_prop_match = re.search(r'<item[^>]*properties=["\'][^"\']*cover-image[^"\']*["\'][^>]*href=["\']([^"\']+)["\']', opf_str, re.IGNORECASE)
                    if cover_prop_match:
                        target_cover_zip_path = cover_prop_match.group(1)

                if not target_cover_zip_path:
                    for item_match in re.finditer(r'<item[^>]*href=["\']([^"\']+)["\']', opf_str, re.IGNORECASE):
                        href = item_match.group(1)
                        if 'cover' in href.lower() and href.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.gif')):
                            target_cover_zip_path = href
                            break

                if target_cover_zip_path:
                    target_cover_zip_path = urllib.parse.unquote(target_cover_zip_path)
                    if opf_dir and not target_cover_zip_path.startswith(opf_dir):
                        target_cover_zip_path = f"{opf_dir}/{target_cover_zip_path}".replace('//', '/')
                else:
                    # Default new cover zip path
                    target_cover_zip_path = f"{opf_dir}/cover.{new_cover_ext}" if opf_dir else f"cover.{new_cover_ext}"
                    # Add item to manifest in OPF if not present
                    cover_item_tag = f'<item id="cover-image" href="cover.{new_cover_ext}" media-type="image/{new_cover_ext}" properties="cover-image"/>\n'
                    manifest_end = re.search(r'</(?:[a-zA-Z0-9_:-]+:)?manifest>', opf_str, re.IGNORECASE)
                    if manifest_end:
                        pos = manifest_end.start()
                        opf_str = opf_str[:pos] + f'  {cover_item_tag}' + opf_str[pos:]

            # Write updated ZIP archive preserving EPUB spec
            with zipfile.ZipFile(temp_output, 'w', compression=zipfile.ZIP_DEFLATED) as z_out:
                namelist = z_in.namelist()

                # Write mimetype uncompressed first
                if 'mimetype' in namelist:
                    z_out.writestr('mimetype', z_in.read('mimetype'), compress_type=zipfile.ZIP_STORED)

                for item in z_in.infolist():
                    if item.filename == 'mimetype':
                        continue
                    
                    if item.filename == opf_path:
                        z_out.writestr(item.filename, opf_str.encode('utf-8'))
                    elif new_cover_bytes and target_cover_zip_path and item.filename == target_cover_zip_path:
                        z_out.writestr(item.filename, new_cover_bytes)
                    else:
                        z_out.writestr(item.filename, z_in.read(item.filename))

                # If new cover path was not in existing zip, add it
                if new_cover_bytes and target_cover_zip_path and target_cover_zip_path not in namelist:
                    z_out.writestr(target_cover_zip_path, new_cover_bytes)

        if os.path.exists(output_path):
            os.remove(output_path)
        os.rename(temp_output, output_path)

        return {
            'success': True,
            'input_file': input_path,
            'output_file': output_path,
            'file_size_bytes': os.path.getsize(output_path),
            'metadata': new_meta,
            'cover_updated': bool(new_cover_bytes)
        }

    except Exception as e:
        if os.path.exists(temp_output):
            try:
                os.remove(temp_output)
            except OSError:
                pass
        raise e
