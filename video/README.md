# Siflo film (60 s, 1080 × 1920, FR and EN)

The film is the site itself: `render.py` loads the page in `?capture` mode in the local Chrome on the GPU, drives the three acts (`canyon`, `signal`, `mesh`) frame by frame on a virtual clock, and draws the overlay of `film.js` / `film.css` on top (titles, cuts, real app screens in phone frames, the Lab card, end card).

Everything sits on the music's grid: **95.7 BPM, one bar = 2.53 s, cuts on bar lines** (`SHOTS` in `render.py`, `SCENES` / `CUTS` / `BOARDS` in `film.js`).

| Time | Picture | Scene |
| --- | --- | --- |
| 0–5.2 s | canyon | Flight into the gorge at dusk |
| 5.2–10.2 s | canyon | Julie whistles, the rings tear apart in the roar of the waterfall |
| 10.2–17.8 s | canyon | Her message (the rope is stuck) hops down to Léa and Tom |
| 17.8–22.9 s | signal | STOP for Marc only: received, then seen |
| 22.9–30.4 s | screens | Offline messaging: the canyon chat, then poll, topo and checklist |
| 30.4–35.5 s | mesh | Phone to phone, internet bridge, LoRa radio |
| 35.5–40.5 s | mesh | SOS reaching every Siflo phone in range |
| 40.5–45.6 s | Lab card | End-to-end encryption, frames of the encryption film, siflo.app/labs |
| 45.6–50.6 s | screens | And more: festivals, Android and iPhone, shared location |
| 50.6–60 s | canyon + overlay | End card (Google Play, App Store, watches) |

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
