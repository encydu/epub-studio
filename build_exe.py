#!/usr/bin/env python3
"""
PyInstaller Build Automation Script for EPUB Studio Desktop App
Bundles Python scripts, HTML, CSS, JS into dist/EPUB Studio/
"""

import os
import sys
import subprocess


def build_app():
    base_dir = os.path.dirname(os.path.abspath(__file__))

    if sys.platform == 'win32':
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    print("--- Building EPUB Studio Desktop Executable with PyInstaller ---")

    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--noconfirm",
        "--onedir",
        "--windowed",
        "--name=EPUB Studio",
        f"--add-data={os.path.join(base_dir, 'index.html')};.",
        f"--add-data={os.path.join(base_dir, 'style.css')};.",
        f"--add-data={os.path.join(base_dir, 'app.js')};.",
        os.path.join(base_dir, "app_desktop.py")
    ]

    print("Running PyInstaller command:")
    print(" ".join(cmd))

    res = subprocess.run(cmd, cwd=base_dir)

    if res.returncode == 0:
        dist_folder = os.path.join(base_dir, "dist", "EPUB Studio")
        exe_path = os.path.join(dist_folder, "EPUB Studio.exe")
        print("\n[SUCCESS] Build Completed Successfully!")
        print(f"   Application Folder: {dist_folder}")
        print(f"   Executable Path: {exe_path}\n")
    else:
        print("\n[ERROR] Build Failed with return code:", res.returncode)


if __name__ == "__main__":
    build_app()
