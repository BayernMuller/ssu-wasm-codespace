#!/usr/bin/env python3
"""Serve Pixel Lab with headers required by SharedArrayBuffer."""

from __future__ import annotations

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


DIST = Path(__file__).resolve().parent / "dist"


class IsolatedHandler(SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        super().end_headers()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    if not DIST.is_dir():
        raise SystemExit("Build Pixel Lab before starting the server")

    handler = partial(IsolatedHandler, directory=str(DIST))
    server = ThreadingHTTPServer(("0.0.0.0", args.port), handler)
    print(f"Serving Pixel Lab on http://127.0.0.1:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
