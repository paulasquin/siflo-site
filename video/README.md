# Siflo film (60 s, 1080 × 1920, FR and EN)

**Since 2026-11-09 the published film is edited in Claude Motion** (FR https://claude.ai/artifact/JraiDGyTv2114RQJxHu4e6, EN https://claude.ai/artifact/1ohk7G7rWmgeuGcZgZsKHc): `render.py --clean` renders the 3D alone, the clips are cut per scene, and Motion draws the titles, screens, end card and the score, then exports the MP4 with sound. `film.js` / `film.css` below are the same overlay for a render without Motion; `compose.sh` muxes a music file onto such a render.

The film is the site itself: `render.py` loads the page in `?capture` mode in the local Chrome on the GPU, drives the three acts (`canyon`, `signal`, `mesh`) frame by frame on a virtual clock, and draws the overlay of `film.js` / `film.css` on top (titles, cuts, real app screens in phone frames, the Lab card, end card).

Cuts sit on the music's beats (95.1 BPM, one bar = 2.52 s). The Motion films (2026-11-11 cut) are the reference; `film.js` keeps the copy of an earlier cut and is not in sync with this order.

| Time | Picture | Scene |
| --- | --- | --- |
| 0–5.2 s | canyon | Flight into the gorge at dusk |
| 5.2–10.2 s | canyon | Julie whistles, the rings tear apart in the roar of the waterfall |
| 10.2–19.1 s | canyon | Her message hops down to Léa and Tom; the range: Bluetooth 25 to 300 m, up to 12 hops, LoRa several km (clip slowed to fit) |
| 19.1–24.1 s | signal | A STOP for the belayer only: received, then seen |
| 24.1–31.7 s | screens | Offline messaging: chat, poll, topo, the offline map of the area, QR invitation |
| 31.7–35.5 s | mesh | Two groups too far apart: the internet links them (relays read nothing) |
| 35.5–40.5 s | mesh | SOS reaching every Siflo phone in range |
| 40.5–45.6 s | Lab card | End-to-end encryption, frames of the encryption film, siflo.app/labs |
| 45.6–50.6 s | screens | And more: festivals, Android and iPhone, shared location |
| 50.6–60 s | canyon + overlay | End card (Google Play, App Store, watches) |

Clips in Motion: each 3D clip is cut to its own shot exactly (no frames of the shots before or after: the player shows a clip's first frame while it seeks), with a keyframe every 6 frames (`-g 6`: the player seeks constantly), and is played by the player in step with the film (no `kit.seek`, which steps a clip frame by frame). Where the background changes, the cut dips lightly through the dark (`SOFT`); the two camera jumps of the 3D acts (whistle → message, internet → SOS) cross-fade over 0.4 s (`W.scene(…, { from, at })`). Boards of screens stay fully on for their whole scene, since the clip under them belongs to another scene.

```bash
python3 -m http.server 8792 --bind 127.0.0.1 &                              # from the repository root
uv run --with playwright python video/render.py --lang=fr --still=8,25,43     # stills in video/out, a few seconds
uv run --with playwright python video/render.py --lang=fr                     # video/out/clean-fr.mp4 (~15 min)
uv run --with playwright python video/render.py --lang=en
video/compose.sh fr en                                                        # music, masters, YouTube files, site files
```

- **Music**: « Smooth Funk Breeze » from Pixabay (Pixabay Content License: free, commercial use, no credit required; not registered with Content ID), cut to 60 s with one splice on a beat. It is not committed: put the 60 s edit at `video/out/music.wav` before `compose.sh`. No sound effects (no whistle). `music.py` is the generated score of the 2026-10 film, kept for reference.
- **Screens**: `assets/screens/*-<lang>.webp` (the site's), plus `video/screens/` (festival, ski poll, iPhone, LoRa radio) taken from the debug demo. `video/labs/` holds 4 s of the encryption film (the box being locked), cropped.
- `out/siflo-film-<lang>.mp4`: masters for Instagram and Drive. `out/siflo-film-<lang>-yt.mp4`: HEVC under 10 MB, because the browser upload to YouTube Studio is capped at 10 MB. `../assets/film/siflo-<lang>.mp4` and `poster-<lang>.jpg`: the 720p files of the site.
- Copy lives in `film.js` (FR and EN); proofread it like the site copy. Keep text between about 55 % and 85 % of the height: Instagram and YouTube cover the top ~12 % and the bottom ~20 %.
- `video/out/` is not committed (masters, frames, music).
