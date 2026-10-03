#!/usr/bin/env python3
import http.server
import socket
import socketserver
import webbrowser
import os
import sys

PORT = 8000

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # doesn't need to be reachable
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

def run():
    # Change working directory to script location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    local_ip = get_local_ip()

    print("=" * 60)
    print("  🏒 HOCKEY STATS SPOTTER - LOCAL SERVER")
    print("=" * 60)
    print(f"\n1. On your Mac, opened at:")
    print(f"   http://localhost:{PORT}")
    print(f"\n2. On your iPhone (connected to same Wi-Fi):")
    print(f"   Open Safari and go to:")
    print(f"   👉 http://{local_ip}:{PORT}")
    print(f"\n3. To install as an app on your iPhone:")
    print(f"   Tap the Share button (square with arrow) -> 'Add to Home Screen'.")
    print(f"   It will work 100% offline at the ice rink!")
    print("\nPress Ctrl+C to stop the server.")
    print("=" * 60)

    # Open Mac browser
    try:
        webbrowser.open(f'http://localhost:{PORT}')
    except Exception:
        pass

    Handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

if __name__ == '__main__':
    run()
