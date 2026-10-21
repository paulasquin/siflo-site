"""Builds siflo.app from the texts kept in the Siflo repository.

The privacy policy is written in `siflo/docs/play/privacy-policy.md`; this script turns it into a
static page, plus the /confidentialite/ redirect. Run from the repository root:

    uv run --with markdown python tools/build.py [path/to/siflo]
"""

import html
import re
import sys
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
SIFLO = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT.parent / "siflo")
PLAY = SIFLO / "docs" / "play"

CONTACT = "contact@aidiligence.eu"
INSTAGRAM = "https://www.instagram.com/siflo.app/"
PUBLISHER = "Guardia SAS — SIREN 910 991 140"

STYLE = """
:root { color-scheme: light dark; --fg: #1f1b18; --muted: #6a625c; --bg: #fffbf8; --line: #eee4dc; --accent: #d95a00; }
@media (prefers-color-scheme: dark) { :root { --fg: #efe9e4; --muted: #a99f97; --bg: #17130f; --line: #2f2822; --accent: #ff8a3d; } }
* { box-sizing: border-box; }
body { font: 16px/1.6 -apple-system, system-ui, "Segoe UI", Roboto, sans-serif; color: var(--fg); background: var(--bg); margin: 0; }
main { max-width: 720px; margin: 0 auto; padding: 32px 20px 64px; }
header { display: flex; align-items: center; gap: 12px; padding-bottom: 16px; border-bottom: 1px solid var(--line); }
header img { width: 40px; height: 40px; border-radius: 10px; }
header a { color: inherit; text-decoration: none; font-weight: 600; font-size: 1.15em; }
nav { margin-left: auto; display: flex; gap: 16px; font-size: .95em; }
nav a { font-weight: 400; font-size: 1em; color: var(--muted); }
h1 { font-size: 1.7em; line-height: 1.25; margin: 1.2em 0 .4em; }
h2 { font-size: 1.2em; margin-top: 2em; }
a { color: var(--accent); }
.lead { font-size: 1.15em; color: var(--muted); }
footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid var(--line); color: var(--muted); font-size: .85em; }
"""


def page(title: str, body: str, depth: int) -> str:
    up = "../" * depth
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="Siflo privacy policy: no account, end-to-end encryption, what the relays see. Politique de confidentialité de Siflo.">
<link rel="canonical" href="https://siflo.app/privacy/">
<link rel="icon" href="{up}assets/icon.png">
<style>{STYLE}</style>
</head>
<body>
<main>
<header>
  <img src="{up}assets/icon.png" alt="">
  <a href="{up}">Siflo</a>
  <nav><a href="{up}privacy/">Privacy</a><a lang="fr" href="{up}privacy/#francais">Confidentialité</a></nav>
</header>
{body}
<footer>{html.escape(PUBLISHER)} — <a href="mailto:{CONTACT}">{CONTACT}</a> — <a href="{INSTAGRAM}">Instagram</a></footer>
</main>
</body>
</html>
"""


def from_markdown(name: str) -> tuple[str, str]:
    """Title and HTML body of a text in docs/play, without its editorial notes."""
    text = (PLAY / name).read_text()
    # Notes for us (sources, status) are blockquotes; never publish them.
    text = "\n".join(line for line in text.splitlines() if not line.startswith(">"))
    title = re.search(r"^# (.+)$", text, re.M).group(1)
    body = markdown.markdown(text, extensions=["extra", "sane_lists"])
    # Stable anchors for the two languages.
    body = body.replace("<h2>English</h2>", '<h2 id="english">English</h2>')
    body = body.replace("<h2>Français</h2>", '<h2 id="francais">Français</h2>')
    # The data deletion URL given to Google Play.
    body = body.replace("<p><strong>Delete your data.</strong>", '<p id="delete"><strong>Delete your data.</strong>')
    body = body.replace("<p><strong>Supprimer vos données.</strong>", '<p id="supprimer"><strong>Supprimer vos données.</strong>')
    # The French half: marked as such, with French spacing before : ; ! ? and inside « ».
    en, fr = body.split('<h2 id="francais">', 1)
    fr = re.sub(r" ([:;!?»])", "\u202f\\1", '<h2 id="francais">' + fr).replace("« ", "«\u202f")
    body = f'{en}<section lang="fr">\n{fr}\n</section>'
    body = re.sub(r"(?<![:>])" + re.escape(CONTACT), f'<a href="mailto:{CONTACT}">{CONTACT}</a>', body)
    return title, body


def write(path: str, content: str) -> None:
    out = ROOT / path
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(content)
    print("wrote", path)


REDIRECT = """<!doctype html>
<html lang="fr">
<meta charset="utf-8">
<title>Siflo</title>
<meta http-equiv="refresh" content="0; url=../privacy/#francais">
<link rel="canonical" href="https://siflo.app/privacy/">
<a href="../privacy/#francais">Politique de confidentialité</a>
"""


def main() -> None:
    title, body = from_markdown("privacy-policy.md")
    write("privacy/index.html", page(title, body, 1))
    write("confidentialite/index.html", REDIRECT)


if __name__ == "__main__":
    main()
