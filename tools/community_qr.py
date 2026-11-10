"""QR code of each community page's group invitation (communaute/qr.svg, community/qr.svg), from the page's data-link.

    uv run --with segno python tools/community_qr.py
"""
import pathlib
import re

import segno

ROOT = pathlib.Path(__file__).resolve().parent.parent
for page in ("communaute", "community"):
    html = (ROOT / page / "index.html").read_text()
    link = re.search(r'data-link="([^"]*)"', html).group(1)
    out = ROOT / page / "qr.svg"
    if not link:
        out.unlink(missing_ok=True)
        continue
    segno.make(link, error="q").save(out, kind="svg", scale=4, border=2, dark="#1f1b18", light="#ffffff", xmldecl=False, svgns=True)
    print(out.relative_to(ROOT), len(link))
