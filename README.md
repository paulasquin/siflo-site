# siflo.aidiligence.eu

Support page and privacy policy of the Siflo Android app (published by Guardia SAS).

The privacy policy is written in the Siflo repository (`docs/play/privacy-policy.md`); this
repository only publishes it. Blockquotes in that file are editorial notes and are left out. After
changing it there:

```bash
uv run --with markdown python tools/build.py ../siflo
```

Preview: `python3 -m http.server 8792`, then <http://localhost:8792>.

Deployment: GitHub Pages, `main` branch, repository root; the domain is declared by `CNAME`.
DNS (OVH, zone `aidiligence.eu`): `siflo CNAME paulasquin.github.io.`

| URL | Content |
|---|---|
| `/` | Support page (contact, tips, links), English then French |
| `/privacy/` | Privacy policy (EN + FR), the URL given to Google Play |
| `/confidentialite/` | Redirect to `/privacy/#francais` |
