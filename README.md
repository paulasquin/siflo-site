# siflo.app

Website of Siflo (published by Guardia SAS), an outdoor communication app that also works offline: on Google Play since v0.1.0, iPhone coming soon. A scroll-driven presentation page in French and English, the support contact, and the privacy policy given to Google Play.

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
| Sections | `index.html` | Field cases (four sourced situations where voice and whistle fail: Petzl, canyon instructor handbook, ULSA, FFME), film, features, screenshots, privacy (the relays' view is scrambled by `main.js`), what to know before going out (range, rock and water), download, FAQ and support. |
| Research | `research/index.html`, `js/research.js`, `css/research.css` | The six ways a phone reaches another one (classic and long-range Bluetooth, nearby Wi-Fi, internet relay, then the alert beacon and satellite, both not in the app yet): estimated range on a shared log scale with the value printed next to each bar, the phones that can use it, what gets through. One data table in `js/research.js` (`[fr, en]` pairs), the page's English copy in the same file. Linked from "what to know before going out", the range FAQ answer and the footer. Opens with two tiles (radio range, encryption) and ends with the encryption and formal verification section (`#verification`: how messages are protected, the seven checked models in one line each, what was found, bounds and limits), drawn from the `MODELS` table of `js/research.js`; its source of truth is `formal/RESULTS.md` and `formal/THREAT_MODEL.md` in `paulasquin/siflo`, to update with them. The home header has a "Recherche" / "Research" button next to the language switch. |

- Shared 3D pieces: `js/world/common.js` (noise, dusk sky, beacons, rings, arcs, packets, `panelPos()`: each act is driven by the panel coordinate, 0 when its first card is centred, 1 for the second… computed from the layout in `main.js`).
- Copy: French in `index.html`, English in `js/strings.js` (`static`), strings drawn by scripts in `js/strings.js` (`ui`). French copy follows the house style (natural French, French typography); proofread both languages after each change.
- Claims stay within the radio study (`/research/`: link-budget estimates, to update once measured in the field; the beacon and satellite are shown as in progress until they ship): range "a few tens of metres", more in hand with line of sight; no "always gets through", nothing about rock or water being crossed, Siflo adds to the whistle and the radio.
- Positioning: "Restez en contact dehors, même hors ligne." / "Stay in touch outdoors, even offline." (the app's onboarding and Play listing); the whistle canyon story is a use case, not the headline. Siflo adds to the whistle and the radio, never replaces them.
- Stores: Siflo is live on Google Play; the hero button, the download badge and the `/j/`, `/id/`, `/c/` pages link to `https://play.google.com/store/apps/details?id=app.siflo`. The iPhone app is not submitted yet, so its badge is a "coming soon" (`.store.pending`), never "in review". Once it is on the App Store, turn the badge into a link and update `dl.lead`, `dl.s2`, `fq.5a`, `fq.6a`, the `/j/`, `/id/` and `/c/` pages, the film's end card and their English strings.
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
| `/research/` | Radio range research (FR/EN, same language pick as the home page) |
| `/recherche/` | Redirect to `/research/?lang=fr` |
| `/confidentialite/` | Redirect to `/privacy/#francais` |
| `/j/`, `/id/`, `/c/` | Landing pages of the app links (group invitation, identity card, contact link) when Siflo is not installed; `js/link.js` picks the language and, offers an "Open in Siflo" button: `siflo://` on iPhone, an `intent://` for `app.siflo` on Android (any version with the app links, Google Play if not installed). The payload stays in the fragment, never sent to the server |
| `/robots.txt`, `/sitemap.xml` | Crawlers: the home page, the research page and the privacy policy (`/j/`, `/id/` and `/c/` are `noindex`) |
| `/.well-known/assetlinks.json` | Android App Links for `app.siflo`: Play app signing key + upload key (GitHub APKs) |
| `/.well-known/apple-app-site-association` | iOS universal links for `285X8VFA49.app.siflo` (`/j`, `/id`, `/c`): a copy of `ios/apple-app-site-association` in the app repo, keep both identical |

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

## Relay list

`relays.txt` is the chain of Siflo relays the apps use, signed with Ed25519 (format and rules: `docs/protocol.md`, "Relay chain", in `paulasquin/siflo`). The apps fetch `https://siflo.app/relays.txt` once a day and only take a list that verifies and was issued after theirs: never edit it by hand, regenerate it with `server/sign_relays.py` of the siflo repository. Until siflo.app serves it, the apps keep the chain they were built with.
