#!/usr/bin/env python3
"""
EPUB Studio Desktop Application Launcher
Runs backend HTTP server in background thread and launches pywebview window.
"""

import os
import sys
import time
import threading
import webbrowser
from http.server import ThreadingHTTPServer

import server
import epub_cleaner

PORT = 8899
HOST = '127.0.0.1'


def start_backend_server():
    server_address = (HOST, PORT)
    try:
        httpd = ThreadingHTTPServer(server_address, server.EPUBCleanerHandler)
        httpd.serve_forever()
    except Exception as e:
        print(f"Server thread message: {e}")


def main():
    # Start backend server in daemon thread
    server_thread = threading.Thread(target=start_backend_server, daemon=True)
    server_thread.start()

    # Wait briefly for server to bind port
    time.sleep(0.4)

    target_url = f"http://{HOST}:{PORT}"

    # Launch native desktop pywebview window if available
    try:
        import webview
        window = webview.create_window(
            title="EPUB Studio - Cleaner, Compressor & Splitter",
            url=target_url,
            width=1280,
            height=820,
            min_size=(900, 600),
            resizable=True
        )
        webview.start()
    except Exception as e:
        print(f"Launching default web browser ({e})...")
        webbrowser.open(target_url)
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
