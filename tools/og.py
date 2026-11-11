"""Social images of the identities' pages (assets/og-<activity>.jpg, og-<activity>-en.jpg): the page's
hero at 1200 × 630, taken with the local Chrome on the GPU. Serve the site first, then:

    python3 -m http.server 8792 --bind 127.0.0.1 &
    uv run --with playwright python tools/og.py [--url=http://127.0.0.1:8792]
"""
import asyncio
import json
import subprocess
import sys
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
URL = next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--url=")), "http://127.0.0.1:8792")


async def main():
    code = "import { PAGES } from './js/activity-data.js'; console.log(JSON.stringify(PAGES));"
    pages = json.loads(subprocess.check_output(["node", "--input-type=module", "-e", code], cwd=ROOT, text=True))
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome", args=["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"])
        for act in ("mountain", "cave", "gathering"):
            for lang, suffix in (("fr", ""), ("en", "-en")):
                ctx = await b.new_context(viewport={"width": 1200, "height": 630})
                pg = await ctx.new_page()
                await pg.goto(URL + pages[act][lang]["path"], wait_until="load")
                await pg.wait_for_function("document.getElementById('loader').classList.contains('done')", timeout=120000)
                await pg.add_style_tag(content=".scroll-cue{visibility:hidden!important}")
                await pg.wait_for_timeout(5000)
                out = ROOT / "assets" / f"og-{act}{suffix}.jpg"
                await pg.screenshot(path=str(out), type="jpeg", quality=84)
                print(out.relative_to(ROOT))
                await ctx.close()
        await b.close()

asyncio.run(main())
