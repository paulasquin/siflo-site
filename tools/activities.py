"""Builds each identity's own page (/montagne/, /speleo/, /festival/ and /en/mountain/, /en/caving/,
/en/festival/) from index.html and en/index.html, and the sitemap.

The page is the home page with the activity set before first paint (<html data-page-activity>), its
texts written in (js/activity-data.js: COPY for the copy, PAGES for the address, title and
descriptions), the sections of the other identities left out (data-only), its own canonical
address, hreflang pair, social image (assets/og-<activity>.jpg, made by tools/og.py) and every
relative link rewritten for its folder. It runs tools/en.py first. Run it after any change to
index.html, the English strings or js/activity-data.js:

    python3 tools/activities.py
"""

import html
import json
import posixpath
import re
import subprocess
from datetime import date
from pathlib import Path

import en

ROOT = Path(__file__).resolve().parent.parent
SITE = en.SITE


def data() -> dict:
    code = "import { COPY, PAGES } from './js/activity-data.js'; console.log(JSON.stringify({ COPY, PAGES }));"
    return json.loads(subprocess.check_output(["node", "--input-type=module", "-e", code], cwd=ROOT, text=True))


def rewrite(s: str, src_dir: str, out_dir: str) -> str:
    """Relative links of a page in src_dir, rewritten for the same files from out_dir."""
    def target(u: str) -> str:
        if not u or re.match(r"^(#|[a-z]+:|//|data:|/)", u):
            return u
        path, sep, rest = re.match(r"^([^?#]*)([?#]?)(.*)$", u).groups()
        folder = path.endswith("/") or path in ("", ".", "./")
        absolute = posixpath.normpath(posixpath.join(src_dir, path)) + ("/" if folder else "")
        absolute = absolute.replace("//", "/")
        rel = posixpath.relpath(absolute, out_dir) + ("/" if folder else "")
        rel = "./" if rel in (".", "./") else rel.replace("//", "/")
        return rel + sep + rest

    s = re.sub(rf'\b({en.URL_ATTRS})="([^"]*)"', lambda m: f'{m.group(1)}="{target(m.group(2))}"', s)
    return re.sub(r'(<script type="importmap">)(.*?)(</script>)',
                  lambda m: m.group(1) + re.sub(r'"(\.{1,2}/[^"]*)"', lambda u: f'"{target(u.group(1))}"', m.group(2)) + m.group(3), s, flags=re.S)


def drop_others(s: str, act: str) -> str:
    """Removes the elements meant for another identity (data-only="…"), with a comment just before them."""
    while True:
        m = next((m for m in re.finditer(r'<([a-z]+)\b[^>]*\bdata-only="([^"]+)"[^>]*>', s) if m.group(2) != act), None)
        if not m:
            return s
        tag, depth, end = m.group(1), 1, None
        for t in re.finditer(rf"<(/?){tag}\b[^>]*>", s[m.end():]):
            depth += -1 if t.group(1) else 1
            if depth == 0:
                end = m.end() + t.end()
                break
        start = s.rfind("\n", 0, m.start()) + 1
        before = s.rfind("\n", 0, start - 1) + 1
        if s[before:start].strip().startswith("<!--"):
            start = before
        s = s[:start] + s[end:].lstrip(" ").removeprefix("\n")


def build(act: str, lang: str, d: dict) -> Path:
    page, pair = d["PAGES"][act][lang], d["PAGES"][act]
    home = "/" if lang == "fr" else "/en/"
    s = (ROOT / ("index.html" if lang == "fr" else "en/index.html")).read_text()
    s = re.sub(r"<!-- Built by tools/en\.py.*?-->\n", "", s, count=1)
    s = s.replace("<!doctype html>", f"<!doctype html>\n<!-- Built by tools/activities.py from {'index.html' if lang == 'fr' else 'en/index.html'} and js/activity-data.js: edit those, then run it again. -->", 1)
    s = re.sub(r'<html lang="(\w+)">', rf'<html lang="\1" data-page-activity="{act}" data-activity="{act}">', s, count=1)
    s = re.sub(r"<title>.*?</title>", f"<title>{html.escape(page['title'])}</title>", s, count=1)
    s = en.meta(s, 'name="description"', page["description"])
    s = en.meta(s, 'property="og:title"', page["og"])
    s = en.meta(s, 'property="og:description"', page["description"])
    s = en.meta(s, 'property="og:url"', SITE + page["path"])
    s = en.meta(s, 'property="og:image"', f"{SITE}/assets/og-{act}{'' if lang == 'fr' else '-en'}.jpg")
    s = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{SITE}{page["path"]}">', s, count=1)
    for hl, path in (("fr", pair["fr"]["path"]), ("en", pair["en"]["path"]), ("x-default", pair["fr"]["path"])):
        s = re.sub(rf'<link rel="alternate" hreflang="{hl}" href="[^"]*">', f'<link rel="alternate" hreflang="{hl}" href="{SITE}{path}">', s, count=1)

    def ld(m):
        j = json.loads(m.group(1))
        j.update(url=SITE + page["path"], description=page["description"])
        return '<script type="application/ld+json">' + json.dumps(j, ensure_ascii=False) + "</script>"
    s = re.sub(r'<script type="application/ld\+json">(.*?)</script>', ld, s, flags=re.S)
    s = en.replace_inner(s, "data-i18n", d["COPY"][act][lang])
    s = drop_others(s, act)
    s = rewrite(s, home, page["path"])
    out = ROOT / page["path"].strip("/") / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(s)
    return out


def sitemap(d: dict) -> None:
    today = date.today().isoformat()
    old = (ROOT / "sitemap.xml").read_text()
    lastmod = dict(re.findall(r"<loc>([^<]+)</loc><lastmod>([^<]+)</lastmod>", old))
    pairs = [(d["PAGES"][a]["fr"]["path"], d["PAGES"][a]["en"]["path"]) for a in ("canyon", "mountain", "cave", "gathering")]
    pairs.append(("/labs/", "/en/labs/"))
    rows = []
    for fr, en_ in pairs:
        alt = (f'<xhtml:link rel="alternate" hreflang="fr" href="{SITE}{fr}"/><xhtml:link rel="alternate" hreflang="en" href="{SITE}{en_}"/>'
               f'<xhtml:link rel="alternate" hreflang="x-default" href="{SITE}{fr}"/>')
        for path in (fr, en_):
            rows.append(f"  <url><loc>{SITE}{path}</loc><lastmod>{today if path not in ('/labs/', '/en/labs/') else lastmod.get(SITE + path, today)}</lastmod>\n    {alt}</url>")
    for path in ("/get/", "/presse/", "/privacy/"):
        rows.append(f"  <url><loc>{SITE}{path}</loc><lastmod>{lastmod.get(SITE + path, today)}</lastmod></url>")
    (ROOT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
                                      + "\n".join(rows) + "\n</urlset>\n")


if __name__ == "__main__":
    for p in en.PAGES:
        print(en.build(*p).relative_to(ROOT))
    d = data()
    for act in ("mountain", "cave", "gathering"):
        for lang in ("fr", "en"):
            print(build(act, lang, d).relative_to(ROOT))
    sitemap(d)
    print("sitemap.xml")
