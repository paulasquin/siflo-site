"""Builds the English pages en/index.html and en/labs/index.html from the French ones and the English strings.

The French page is the source; the English copy lives in js/strings.js and js/labs-strings.js (`static`, keyed by
data-i18n). Each English page is the French one with that copy written in, its own address (canonical, og:url, the
JSON-LD url) and every relative link rewritten for its folder: the home page and Labs stay in /en/, everything else
(assets, privacy policy, /get) points back to the shared files. Its scripts still apply the same strings at run time.
Run it after any change to index.html, labs/index.html or their English strings:

    python3 tools/en.py
"""

import html
import json
import posixpath
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://siflo.app"
PAGES = [("index.html", "/", "js/strings.js", "STRINGS"), ("labs/index.html", "/labs/", "js/labs-strings.js", "LABS_STRINGS")]
URL_ATTRS = r"href|src|poster|data-full|data-src-fr|data-src-en|data-poster-en"


def strings(module: str, name: str) -> dict:
    code = f"import {{ {name} }} from './{module}'; console.log(JSON.stringify({name}.static));"
    return json.loads(subprocess.check_output(["node", "--input-type=module", "-e", code], cwd=ROOT, text=True))


def replace_inner(s: str, attr: str, values: dict) -> str:
    """Replaces the content of every element carrying attr="key" with values[key] (HTML)."""
    out, i = [], 0
    for m in re.finditer(rf'<([a-z0-9]+)\b[^>]*\b{attr}="([^"]+)"[^>]*>', s):
        if m.start() < i or m.group(2) not in values:
            continue
        tag, depth, j = m.group(1), 1, m.end()
        for t in re.finditer(rf"<(/?){tag}\b[^>]*>", s[m.end():]):
            depth += -1 if t.group(1) else 1
            if depth == 0:
                j = m.end() + t.start()
                break
        else:
            raise ValueError(f"unclosed <{tag} {attr}={m.group(2)}>")
        out += [s[i:m.end()], values[m.group(2)]]
        i = j
    return "".join(out) + s[i:]


def set_attr(s: str, key_attr: str, attr: str, values: dict) -> str:
    def one(m):
        tag, key = m.group(0), m.group(1)
        if key not in values:
            return tag
        v = html.escape(values[key], quote=True)
        return re.sub(rf'\b{attr}="[^"]*"', f'{attr}="{v}"', tag) if re.search(rf'\b{attr}="', tag) else tag[:-1] + f' {attr}="{v}">'
    return re.sub(rf'<[^>]*\b{key_attr}="([^"]+)"[^>]*>', one, s)


def meta(s: str, sel: str, value: str | None) -> str:
    if value is None:
        return s
    return re.sub(rf'(<meta {sel} content=")[^"]*(")', lambda m: m.group(1) + html.escape(value, quote=True) + m.group(2), s, count=1)


def rewrite_urls(s: str, fr_dir: str, en_dir: str) -> str:
    def target(u: str) -> str:
        if re.match(r"^(#|[a-z]+:|//|data:)", u) or not u:
            return u
        path, sep, rest = re.match(r"^([^?#]*)([?#]?)(.*)$", u).groups()
        absolute = posixpath.normpath(posixpath.join(fr_dir, path)) + ("/" if path.endswith("/") or path in ("", ".", "./") else "")
        absolute = absolute.replace("//", "/")
        if absolute == "/" or absolute.startswith("/labs/"):
            absolute = "/en" + absolute
        rel = posixpath.relpath(absolute, en_dir) + ("/" if absolute.endswith("/") else "")
        rel = "./" if rel in (".", "./") else rel.replace("//", "/")
        return rel + sep + rest

    s = re.sub(rf'\b({URL_ATTRS})="([^"]*)"', lambda m: f'{m.group(1)}="{target(m.group(2))}"', s)
    # The import map's paths.
    return re.sub(r'(<script type="importmap">)(.*?)(</script>)',
                  lambda m: m.group(1) + re.sub(r'"(\.{1,2}/[^"]*)"', lambda u: f'"{target(u.group(1))}"', m.group(2)) + m.group(3), s, flags=re.S)


def build(src: str, path: str, module: str, name: str) -> Path:
    st = strings(module, name)
    s = (ROOT / src).read_text()
    en_path = "/en" + path
    s = s.replace('<html lang="fr">', '<html lang="en">', 1)
    s = s.replace("<!doctype html>", f"<!doctype html>\n<!-- Built by tools/en.py from {src} and {module}: edit those, then run it again. -->", 1)
    # The French page's language pick and redirect: this page is English whatever the browser says.
    s, n = re.subn(r"  <script>\n    // (?:Pick the language|Same language pick).*?</script>\n", "", s, count=1, flags=re.S)
    assert n == 1, "language script not found"
    s = re.sub(r"<title>.*?</title>", f"<title>{html.escape(st['meta.title'])}</title>", s, count=1)
    s = meta(s, 'name="description"', st.get("meta.description"))
    s = meta(s, 'property="og:title"', st.get("meta.og.title"))
    s = meta(s, 'property="og:description"', st.get("meta.og.description"))
    s = meta(s, 'property="og:image:alt"', st.get("meta.og.alt"))
    s = meta(s, 'property="og:url"', SITE + en_path)
    s = s.replace('content="fr_FR"', 'content="__EN__"').replace('content="en_US"', 'content="fr_FR"').replace('content="__EN__"', 'content="en_US"')
    s = s.replace(f'<link rel="canonical" href="{SITE}{path}">', f'<link rel="canonical" href="{SITE}{en_path}">')

    def ld(m):
        data = json.loads(m.group(1))
        data.update(url=SITE + en_path, inLanguage="en", description=st.get("meta.description", data.get("description")))
        return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False) + "</script>"
    s = re.sub(r'<script type="application/ld\+json">(.*?)</script>', ld, s, flags=re.S)

    s = replace_inner(s, "data-i18n", st)
    s = set_attr(s, "data-i18n-aria", "aria-label", st)
    s = set_attr(s, "data-i18n-alt", "alt", st)
    s = set_attr(s, "data-i18n-badge", "data-badge", st)
    # English readers start at the top of the policy, where the English text is.
    s = s.replace("privacy/#francais", "privacy/")
    s = rewrite_urls(s, path, en_path)
    # The film's English poster from the start.
    s = re.sub(r'poster="[^"]*"([^>]*?)data-poster-en="([^"]*)"', r'poster="\2"\1data-poster-en="\2"', s)
    out = ROOT / en_path.strip("/") / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(s)
    return out


if __name__ == "__main__":
    for page in PAGES:
        print(build(*page).relative_to(ROOT))
