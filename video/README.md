# Siflo film (48 s, 1080 × 1920, FR and EN)

The film is the site itself: `render.py` loads the page in `?capture` mode in the local Chrome on the GPU, drives the three acts (`canyon`, `signal`, `mesh`) frame by frame on a virtual clock, and draws the overlay of `film.js` / `film.css` on top (titles, cuts, feature montage with the real app screens, end card). `music.py` then synthesises the score and places the sound effects on the events the acts emitted during the render (whistle rings, packets, vibrations, SOS), so they land on the right frame.

Everything sits on the score's grid: **96 BPM, one bar = 2.5 s, cuts on bar lines** (`SHOTS` in `render.py`, `SCENES` / `CUTS` in `film.js`, `CUT` in `music.py`).

| Time | Act | Scene |
| --- | --- | --- |
| 0–5 s | canyon | Flight into the gorge at dusk |
| 5–10 s | canyon | Julie whistles, the rings tear apart in the roar of the waterfall |
| 10–17.5 s | canyon | Her message (the rope is stuck) hops down to Léa and Tom, acknowledgements come back |
| 17.5–25 s | signal | STOP for Marc only: alert, vibration, received then seen |
| 25–32.5 s | mesh | Bluetooth hops, internet bridge, the member who fell behind gets everything |
| 32.5–37.5 s | mesh | SOS reaching every Siflo phone in range |
| 37.5–42.5 s | overlay | Messages, photos, voice notes, QR code (real screens) |
| 42.5–48 s | canyon + overlay | End card |

```bash
python3 -m http.server 8792 --bind 127.0.0.1 &                              # from the repository root
uv run --with playwright python video/render.py --lang=fr --still=7,20,35     # stills in video/out, a few seconds
uv run --with playwright python video/render.py --lang=fr                     # video/out/clean-fr.mp4 + events-fr.json (~15 min)
uv run --with playwright python video/render.py --lang=en
video/compose.sh                                                              # music, masters, YouTube files, site files
```

- `out/siflo-film-<lang>.mp4`: masters for Instagram and Drive. `out/siflo-film-<lang>-yt.mp4`: HEVC under 10 MB, because the browser upload to YouTube Studio is capped at 10 MB. `../assets/film/siflo-<lang>.mp4` and `poster-<lang>.jpg`: the 720p files of the site.
- Copy lives in `film.js` (FR and EN); proofread it like the site copy. Keep text between about 55 % and 85 % of the height and the end card's lower part quiet: Instagram and YouTube cover the top ~12 % and the bottom ~20 %.
- The music is generated, so only its levels and spectrum are checked automatically (`ffmpeg -af volumedetect`: about −15 dB mean, −1 dB peak); listen to it before publishing.
- `video/out/` is not committed (masters, frames, events).
