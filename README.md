# siflo.app

Website of the Siflo Android app (published by Guardia SAS): a scroll-driven presentation page in French and English, the support contact, and the privacy policy given to Google Play.

Built on the template [`paulasquin/showcase-kit`](https://github.com/paulasquin/showcase-kit) (private; act contract, testing routine and pitfalls in its README). Static site, no build step. Unlike the kit, **every resource is self-hosted** (three.js 0.186.1 and its post-processing addons, GSAP 3.15, Lenis, fonts in `assets/`), as on aidiligence.eu: the page makes no third-party request, the film included.

```bash
python3 -m http.server 8792 --bind 127.0.0.1   # http://127.0.0.1:8792/  (?debug exposes window.__kit, ?lang=en forces English)
```

## Page

| Part | File | What it shows |
| --- | --- | --- |
| Act `canyon` | `js/acts/canyon.js` | Hero: a procedural gorge at dusk. Julie whistles at the top of a waterfall, the rings tear apart in the roar, then her message (the rope is stuck) hops from phone to phone down to Léa and Tom, who went ahead, and the acknowledgements come back. |
| Act `signal` | `js/acts/signal.js` | Julie's phone sends STOP to Marc alone, Marc's phone rings full screen and vibrates, then "received" and "seen" come back. The screens are canvases drawn from the app's dark theme, in the page language. |
| Act `mesh` | `js/acts/mesh.js` | Contour map: Bluetooth hops, a ridge member's 4G bridging a far subgroup through the blind relay, a member who fell behind upstream getting the stored messages back in range, an SOS reaching another group. |
| Sections | `index.html` | Field cases (four sourced situations where voice and whistle fail: Petzl, canyon instructor handbook, ULSA, FFME), film, features, screenshots, privacy (the relay's view is scrambled by `main.js`), what to know before going out (range, rock and water), download, FAQ and support. |

- Shared 3D pieces: `js/world/common.js` (noise, dusk sky, beacons, rings, arcs, packets, `panelPos()`: each act is driven by the panel coordinate, 0 when its first card is centred, 1 for the second… computed from the layout in `main.js`).
- Copy: French in `index.html`, English in `js/strings.js` (`static`), strings drawn by scripts in `js/strings.js` (`ui`). French copy follows the house style (natural French, French typography); proofread both languages after each change.
- Claims stay within the radio study: range "a few tens of metres", more in hand with line of sight; no "always gets through", nothing about rock or water being crossed, Siflo adds to the whistle and the radio.
- Google Play: the app is under review, so the store button is a "coming soon" badge (`.store.pending`). Once the listing is live, turn it into a link to `https://play.google.com/store/apps/details?id=app.siflo`, and update `hero.cta1`, `dl.lead` and their English strings.
- Film: `assets/film/siflo-{fr,en}.mp4` and `poster-{fr,en}.jpg` are the 720p cuts of the 48 s film, rendered from the site's own acts by `video/` (see `video/README.md`).

## Privacy policy

The privacy policy is written in the Siflo repository (`docs/play/privacy-policy.md`); this repository only publishes it. Blockquotes in that file are editorial notes and are left out. After changing it there:

```bash
uv run --with markdown python tools/build.py ../siflo
```

| URL | Content |
|---|---|
| `/` | Presentation, support and FAQ (FR/EN) |
| `/privacy/` | Privacy policy (EN + FR), the URL given to Google Play |
| `/confidentialite/` | Redirect to `/privacy/#francais` |
| `/j/`, `/id/` | Landing pages of the app links (group invitation, identity card) when Siflo is not installed; `js/link.js` picks the language and, on iPhone, offers `siflo://`. The payload stays in the fragment, never sent to the server |
| `/.well-known/assetlinks.json` | Android App Links for `app.siflo`: Play app signing key + upload key (GitHub APKs) |

## Testing

```bash
uv run --with playwright python tools/shot.py /tmp/sf/canyon canyon 0 1 2                 # act alone, local Chrome on the GPU
uv run --with playwright python tools/shot.py /tmp/sf/ui signal 0 1 2 --ui --w=390 --h=844  # with the cards, phone size
uv run --with playwright python tools/shot.py /tmp/sf/faq '#aide' 0.1 --ui --lang=en        # a plain section
```

Custom shaders output linear colours that the final pass tone-maps and converts to sRGB: keep their values low (a linear 0.1 already shows as a light grey).

## Deployment

GitHub Pages, `main` branch, repository root; the domain is declared by `CNAME` (`siflo.app`, verified on the GitHub account). DNS (OVH, zone `siflo.app`, owner Guardia SAS): GitHub Pages A/AAAA on the apex, `www CNAME paulasquin.github.io.`, set by `tools/ovh_dns.py`; MX and SPF are OVH's (Zimbra mailbox). `.app` is HSTS-preloaded: the site only works over HTTPS.

The former domain `siflo.aidiligence.eu` (still the privacy policy URL given to Google Play) is served by the `paulasquin/siflo-redirect` repository, which sends every path to the same path on siflo.app.

The OVH order also came with a free web hosting (`sifloai.cluster129.hosting.ovh.net`, 100 MB, one attached domain: siflo.app). It is unused; it could serve `apple-app-site-association` as `application/json` if Apple ever insists on it.
