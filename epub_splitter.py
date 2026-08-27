#!/usr/bin/env python3
"""
EPUB Splitter & Image Compressor Core Engine
Splits large EPUBs into smaller volume parts, compresses internal images,
and converts image assets to WebP for maximum space savings.
"""

import os
import sys
import re
import zipfile
import urllib.parse
import xml.etree.ElementTree as ET
import io
from PIL import Image

# Register XML namespaces
NAMESPACES = {
    'container': 'urn:oasis:names:tc:opendocument:xmlns:container',
    'opf': 'http://www.idpf.org/2007/opf',
    'dc': 'http://purl.org/dc/elements/1.1/',
    'ncx': 'http://www.daisy.org/z3986/2005/ncx/',
    'xhtml': 'http://www.w3.org/1999/xhtml'
}

for prefix, uri in NAMESPACES.items():
    ET.register_namespace(prefix, uri)
ET.register_namespace('', NAMESPACES['opf'])
ET.register_namespace('dc', NAMESPACES['dc'])


class EpubSplitterEngine:
    def __init__(self, input_path, max_size_mb=10, output_dir=None, use_webp=False, webp_quality=75, max_image_res=1000, progress_callback=None):
        self.input_path = input_path
        self.max_size_bytes = int(float(max_size_mb) * 1024 * 1024)
        self.output_dir = output_dir or os.path.dirname(input_path)
        self.progress_callback = progress_callback
        self.use_webp = use_webp
        self.webp_quality = webp_quality
        self.max_image_res = max_image_res
        self.compressed_cache = {}

    def log(self, msg):
        if self.progress_callback:
            self.progress_callback(msg)

    def _is_image(self, path):
        ext = os.path.splitext(path)[1].lower()
        return ext in ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp']

    def _resolve_path(self, base_path, rel_path):
        if not base_path:
            return rel_path
        base_parts = base_path.split('/')[:-1]
        rel_parts = rel_path.split('/')
        for part in rel_parts:
            if part == '..':
                if base_parts:
                    base_parts.pop()
            elif part != '.' and part != '':
                base_parts.append(part)
        return '/'.join(base_parts)

    def _get_referenced_files(self, html_content, html_zip_path):
        urls = re.findall(r'(?:src|href)\s*=\s*["\']([^"\']+)["\']', html_content.decode('utf-8', errors='ignore'), flags=re.IGNORECASE)
        referenced = set()
        for url in urls:
            if url.startswith(('http://', 'https://', 'mailto:', 'data:')):
                continue
            url = url.split('#')[0]
            if not url:
                continue
            url = urllib.parse.unquote(url)
            full_path = self._resolve_path(html_zip_path, url)
            referenced.add(full_path)
        return referenced

    def _prune_ncx(self, node, valid_hrefs, base_dir):
        ns = f"{{{NAMESPACES['ncx']}}}"
        is_valid = False
        content_node = node.find(f"{ns}content")
        if content_node is not None:
            src = content_node.get("src", "")
            base_src = urllib.parse.unquote(src.split("#")[0])
            full_path = self._resolve_path(base_dir + "/", base_src) if base_dir else base_src
            if full_path in valid_hrefs:
                is_valid = True

        children_to_remove = []
        for child in node.findall(f"{ns}navPoint"):
            if self._prune_ncx(child, valid_hrefs, base_dir):
                is_valid = True
            else:
                children_to_remove.append(child)
        for child in children_to_remove:
            node.remove(child)
        return is_valid

    def _prune_nav(self, node, valid_hrefs, base_dir):
        ns = f"{{{NAMESPACES['xhtml']}}}"
        is_valid = False
        a_node = node.find(f"{ns}a")
        if a_node is not None:
            href = urllib.parse.unquote(a_node.get("href", "").split("#")[0])
            full_path = self._resolve_path(base_dir + "/", href) if base_dir else href
            if full_path in valid_hrefs:
                is_valid = True

        for list_tag in [f"{ns}ol", f"{ns}ul"]:
            child_list = node.find(list_tag)
            if child_list is not None:
                children_to_remove = []
                for li in child_list.findall(f"{ns}li"):
                    if self._prune_nav(li, valid_hrefs, base_dir):
                        is_valid = True
                    else:
                        children_to_remove.append(li)
                for li in children_to_remove:
                    child_list.remove(li)
                if len(child_list.findall(f"{ns}li")) == 0:
                    node.remove(child_list)
        return is_valid

    def process_split(self):
        if not os.path.exists(self.input_path):
            raise FileNotFoundError(f"Input file not found: {self.input_path}")

        os.makedirs(self.output_dir, exist_ok=True)
        created_files = []

        with zipfile.ZipFile(self.input_path, 'r') as zip_in:
            file_list = zip_in.namelist()
            file_info_map = {info.filename: info for info in zip_in.infolist()}

            if "META-INF/container.xml" not in file_list:
                raise Exception("Invalid EPUB format (container.xml missing).")

            container_data = zip_in.read("META-INF/container.xml")
            container_tree = ET.fromstring(container_data)
            ns_container = f"{{{NAMESPACES['container']}}}"
            rootfiles = container_tree.find(f"{ns_container}rootfiles")
            opf_path = None
            if rootfiles is not None:
                for rootfile in rootfiles.findall(f"{ns_container}rootfile"):
                    if rootfile.get("media-type") == "application/oebps-package+xml":
                        opf_path = rootfile.get("full-path")
                        break

            if not opf_path or opf_path not in file_list:
                raise Exception("OPF package file not found inside EPUB.")

            opf_base_dir = '/'.join(opf_path.split('/')[:-1])
            opf_data = zip_in.read(opf_path)
            opf_tree = ET.fromstring(opf_data)
            ns_opf = f"{{{NAMESPACES['opf']}}}"

            manifest_node = opf_tree.find(f"{ns_opf}manifest")
            spine_node = opf_tree.find(f"{ns_opf}spine")

            manifest_items = {}
            for item in manifest_node.findall(f"{ns_opf}item"):
                item_id = item.get("id")
                href = item.get("href")
                href_decoded = urllib.parse.unquote(href)
                media_type = item.get("media-type")
                full_path = self._resolve_path(opf_path, href_decoded)
                size = file_info_map[full_path].file_size if full_path in file_info_map else 0
                manifest_items[item_id] = {
                    "href": href,
                    "media-type": media_type,
                    "full_path": full_path,
                    "size": size,
                    "element": item
                }

            toc_ncx_id = spine_node.get("toc")
            nav_xhtml_id = None
            for item_id, item_data in manifest_items.items():
                if item_data.get("element").get("properties") == "nav":
                    nav_xhtml_id = item_id
                    break

            toc_files = []
            if toc_ncx_id and toc_ncx_id in manifest_items:
                toc_files.append(manifest_items[toc_ncx_id]["full_path"])
            if nav_xhtml_id and nav_xhtml_id in manifest_items:
                toc_files.append(manifest_items[nav_xhtml_id]["full_path"])

            spine_item_ids = [itemref.get("idref") for itemref in spine_node.findall(f"{ns_opf}itemref")]

            common_files = set(["META-INF/container.xml", "mimetype", opf_path])
            common_files.update(toc_files)
            for item_id, item_data in manifest_items.items():
                mt = item_data["media-type"]
                if mt.startswith(("text/css", "font/", "application/font", "image/font")) or "font" in mt:
                    common_files.add(item_data["full_path"])

            base_size = sum(file_info_map[f].file_size for f in common_files if f in file_info_map)
            parts = []
            current_part = {'spine_ids': [], 'files': set(common_files)}
            current_size = base_size

            for item_id in spine_item_ids:
                item_data = manifest_items.get(item_id)
                if not item_data:
                    continue
                full_path = item_data["full_path"]
                if full_path not in file_list:
                    continue

                spine_files = {full_path}
                html_content = zip_in.read(full_path)
                referenced = self._get_referenced_files(html_content, full_path)
                for ref_path in referenced:
                    if ref_path in file_list:
                        spine_files.add(ref_path)

                added_size = 0
                for f in spine_files:
                    if f not in current_part['files']:
                        if self.use_webp and self._is_image(f) and f in file_list:
                            if f not in self.compressed_cache:
                                try:
                                    img_data = zip_in.read(f)
                                    img = Image.open(io.BytesIO(img_data))
                                    if self.max_image_res > 0 and (img.width > self.max_image_res or img.height > self.max_image_res):
                                        try:
                                            resample_filter = Image.Resampling.LANCZOS
                                        except AttributeError:
                                            resample_filter = Image.LANCZOS
                                        img.thumbnail((self.max_image_res, self.max_image_res), resample_filter)
                                    out = io.BytesIO()
                                    img.save(out, format='webp', quality=self.webp_quality, optimize=True)
                                    new_ext_path = os.path.splitext(f)[0] + '.webp'
                                    self.compressed_cache[f] = (new_ext_path, out.getvalue())
                                except Exception:
                                    self.compressed_cache[f] = (f, zip_in.read(f))
                            added_size += len(self.compressed_cache[f][1])
                        else:
                            added_size += file_info_map[f].file_size if f in file_info_map else 0

                if current_size + added_size > self.max_size_bytes and len(current_part['spine_ids']) > 0:
                    parts.append(current_part)
                    current_part = {'spine_ids': [], 'files': set(common_files)}
                    current_size = base_size
                    added_size = sum(
                        len(self.compressed_cache[f][1]) if (self.use_webp and f in self.compressed_cache)
                        else (file_info_map[f].file_size if f in file_info_map else 0)
                        for f in spine_files if f not in current_part['files']
                    )

                current_part['spine_ids'].append(item_id)
                current_part['files'].update(spine_files)
                current_size += added_size

            if current_part['spine_ids']:
                parts.append(current_part)

            base_name = os.path.splitext(os.path.basename(self.input_path))[0]

            for i, part in enumerate(parts):
                part_num = i + 1
                part_filename = f"{base_name}_Part{part_num}.epub"
                part_path = os.path.join(self.output_dir, part_filename)

                with zipfile.ZipFile(part_path, 'w', zipfile.ZIP_DEFLATED) as zip_out:
                    if "mimetype" in file_list:
                        zip_out.writestr("mimetype", zip_in.read("mimetype"), compress_type=zipfile.ZIP_STORED)
                    else:
                        zip_out.writestr("mimetype", "application/epub+zip", compress_type=zipfile.ZIP_STORED)

                    for f in part['files']:
                        if f == "mimetype" or f not in file_list:
                            continue
                        data = zip_in.read(f)

                        if f == opf_path:
                            part_opf_tree = ET.fromstring(data)
                            dc_title = part_opf_tree.find(f".//{{{NAMESPACES['dc']}}}title")
                            if dc_title is not None and dc_title.text:
                                dc_title.text = f"{dc_title.text} (Part {part_num})"
                            part_manifest = part_opf_tree.find(f"{ns_opf}manifest")
                            for item in part_manifest.findall(f"{ns_opf}item"):
                                href = item.get("href")
                                href_decoded = urllib.parse.unquote(href)
                                fp = self._resolve_path(opf_path, href_decoded)
                                if fp not in part['files']:
                                    part_manifest.remove(item)
                                elif self.use_webp and fp in self.compressed_cache:
                                    new_fp = self.compressed_cache[fp][0]
                                    if new_fp != fp:
                                        new_href = href.replace(os.path.basename(fp), os.path.basename(new_fp))
                                        item.set('href', new_href)
                                        item.set('media-type', 'image/webp')

                            part_spine = part_opf_tree.find(f"{ns_opf}spine")
                            for itemref in part_spine.findall(f"{ns_opf}itemref"):
                                if itemref.get("idref") not in part['spine_ids']:
                                    part_spine.remove(itemref)
                            data = ET.tostring(part_opf_tree, encoding='utf-8', xml_declaration=True)

                        elif toc_ncx_id and f == manifest_items[toc_ncx_id]["full_path"]:
                            ncx_tree = ET.fromstring(data)
                            navMap = ncx_tree.find(f"{{{NAMESPACES['ncx']}}}navMap")
                            if navMap is not None:
                                valid_hrefs = {item["full_path"] for id, item in manifest_items.items() if item["full_path"] in part['files']}
                                children_to_remove = [navPoint for navPoint in navMap.findall(f"{{{NAMESPACES['ncx']}}}navPoint") if not self._prune_ncx(navPoint, valid_hrefs, opf_base_dir)]
                                for child in children_to_remove:
                                    navMap.remove(child)
                            data = ET.tostring(ncx_tree, encoding='utf-8', xml_declaration=True)

                        elif nav_xhtml_id and f == manifest_items[nav_xhtml_id]["full_path"]:
                            nav_tree = ET.fromstring(data)
                            valid_hrefs = {item["full_path"] for id, item in manifest_items.items() if item["full_path"] in part['files']}
                            for nav_elem in nav_tree.findall(f".//{{{NAMESPACES['xhtml']}}}nav"):
                                if nav_elem.get(f"{{{NAMESPACES['opf']}}}type") == "toc" or "toc" in nav_elem.get("type", "") or nav_elem.get("id") == "toc":
                                    for list_tag in [f"{{{NAMESPACES['xhtml']}}}ol", f"{{{NAMESPACES['xhtml']}}}ul"]:
                                        child_list = nav_elem.find(list_tag)
                                        if child_list is not None:
                                            children_to_remove = [li for li in child_list.findall(f"{{{NAMESPACES['xhtml']}}}li") if not self._prune_nav(li, valid_hrefs, opf_base_dir)]
                                            for li in children_to_remove:
                                                child_list.remove(li)
                            data = ET.tostring(nav_tree, encoding='utf-8', xml_declaration=True)

                        if self.use_webp and f.lower().endswith(('.html', '.xhtml', '.htm')):
                            try:
                                text = data.decode('utf-8')
                                text = re.sub(r'(?i)\.png([\'"])', r'.webp\1', text)
                                text = re.sub(r'(?i)\.jpe?g([\'"])', r'.webp\1', text)
                                text = re.sub(r'(?i)\.bmp([\'"])', r'.webp\1', text)
                                text = re.sub(r'(?i)\.gif([\'"])', r'.webp\1', text)
                                data = text.encode('utf-8')
                            except Exception:
                                pass

                        if self.use_webp and f in self.compressed_cache:
                            new_f, img_data = self.compressed_cache[f]
                            zip_out.writestr(new_f, img_data)
                        else:
                            zip_out.writestr(f, data)

                created_files.append({
                    'filename': part_filename,
                    'path': part_path,
                    'size_bytes': os.path.getsize(part_path)
                })

        return created_files


def compress_epub_images(input_path, output_path=None, webp_quality=75, max_image_res=1000):
    """
    Compresses all images inside an EPUB file and converts them to WebP.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")

    if output_path is None:
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}_compressed{ext}"

    temp_output = output_path + ".tmp"
    original_size = os.path.getsize(input_path)
    images_compressed = 0

    try:
        with zipfile.ZipFile(input_path, 'r') as z_in:
            with zipfile.ZipFile(temp_output, 'w', compression=zipfile.ZIP_DEFLATED) as z_out:
                namelist = z_in.namelist()

                # Step 1: Mimetype
                if 'mimetype' in namelist:
                    z_out.writestr('mimetype', z_in.read('mimetype'), compress_type=zipfile.ZIP_STORED)

                image_replacements = {}

                # Step 2: Compress images
                for item in z_in.infolist():
                    if item.filename == 'mimetype':
                        continue

                    data = z_in.read(item.filename)
                    ext = os.path.splitext(item.filename)[1].lower()

                    if ext in ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif']:
                        try:
                            img = Image.open(io.BytesIO(data))
                            if max_image_res > 0 and (img.width > max_image_res or img.height > max_image_res):
                                try:
                                    resample_filter = Image.Resampling.LANCZOS
                                except AttributeError:
                                    resample_filter = Image.LANCZOS
                                img.thumbnail((max_image_res, max_image_res), resample_filter)

                            out = io.BytesIO()
                            img.save(out, format='webp', quality=int(webp_quality), optimize=True)
                            new_data = out.getvalue()

                            new_filename = os.path.splitext(item.filename)[0] + '.webp'
                            image_replacements[item.filename] = new_filename
                            z_out.writestr(new_filename, new_data)
                            images_compressed += 1
                            continue
                        except Exception:
                            pass

                    # Write unchanged binary files initially
                    if not item.filename.lower().endswith(('.xhtml', '.html', '.htm', '.opf')):
                        z_out.writestr(item.filename, data)

                # Step 3: Rewrite HTML and OPF references to WebP
                for item in z_in.infolist():
                    if item.filename == 'mimetype' or os.path.splitext(item.filename)[1].lower() in ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif']:
                        continue

                    if item.filename.lower().endswith(('.xhtml', '.html', '.htm', '.opf')):
                        try:
                            content_str = z_in.read(item.filename).decode('utf-8')
                            for old_img, new_img in image_replacements.items():
                                old_base = os.path.basename(old_img)
                                new_base = os.path.basename(new_img)
                                content_str = content_str.replace(old_base, new_base)

                            if item.filename.lower().endswith('.opf'):
                                content_str = re.sub(r'media-type=["\']image/(?:jpeg|png|gif|bmp)["\']', 'media-type="image/webp"', content_str)

                            data = content_str.encode('utf-8')
                        except UnicodeDecodeError:
                            data = z_in.read(item.filename)

                        z_out.writestr(item.filename, data)

        if os.path.exists(output_path):
            os.remove(output_path)
        os.rename(temp_output, output_path)

        cleaned_size = os.path.getsize(output_path)
        return {
            'input_file': input_path,
            'output_file': output_path,
            'original_size_bytes': original_size,
            'compressed_size_bytes': cleaned_size,
            'size_difference_bytes': original_size - cleaned_size,
            'images_compressed': images_compressed,
            'success': True
        }
    except Exception as e:
        if os.path.exists(temp_output):
            try:
                os.remove(temp_output)
            except OSError:
                pass
        raise e


def split_epub_file(input_path, max_size_mb=10, output_dir=None, use_webp=False, webp_quality=75, max_image_res=1000):
    """
    Splits an EPUB into multiple smaller volumes.
    """
    engine = EpubSplitterEngine(
        input_path=input_path,
        max_size_mb=max_size_mb,
        output_dir=output_dir,
        use_webp=use_webp,
        webp_quality=webp_quality,
        max_image_res=max_image_res
    )
    return engine.process_split()
