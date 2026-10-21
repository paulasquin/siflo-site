#!/usr/bin/env bash
# Mux the rendered film with its soundtrack, for each language:
#   out/siflo-film-<lang>.mp4      master, 1080×1920, for Instagram and Drive
#   out/siflo-film-<lang>-yt.mp4   HEVC under 10 MB (the browser upload to YouTube Studio is capped at 10 MB)
#   ../assets/film/siflo-<lang>.mp4 720p for the site, and its poster (the end card)
set -euo pipefail
cd "$(dirname "$0")"
for lang in fr en; do
  uv run --with numpy --with scipy python music.py "$lang" >/dev/null
  ffmpeg -hide_banner -loglevel error -y -i "out/clean-$lang.mp4" -i "out/music-$lang.wav" \
    -map 0:v -map 1:a -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -profile:v high -level 4.2 -r 30 \
    -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "out/siflo-film-$lang.mp4"
  ffmpeg -hide_banner -loglevel error -y -i "out/siflo-film-$lang.mp4" -c:v libx265 -b:v 1500k -x265-params "pass=1:stats=/tmp/siflo-x265-$lang.log:log-level=error" \
    -an -f null /dev/null
  ffmpeg -hide_banner -loglevel error -y -i "out/siflo-film-$lang.mp4" -c:v libx265 -b:v 1500k -x265-params "pass=2:stats=/tmp/siflo-x265-$lang.log:log-level=error" \
    -tag:v hvc1 -c:a aac -b:a 128k -movflags +faststart "out/siflo-film-$lang-yt.mp4"
  ffmpeg -hide_banner -loglevel error -y -i "out/siflo-film-$lang.mp4" -vf scale=720:1280:flags=lanczos \
    -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "../assets/film/siflo-$lang.mp4"
  ffmpeg -hide_banner -loglevel error -y -ss 46.5 -i "out/siflo-film-$lang.mp4" -frames:v 1 -vf scale=720:1280 -q:v 4 "../assets/film/poster-$lang.jpg"
  ls -lh "out/siflo-film-$lang.mp4" "out/siflo-film-$lang-yt.mp4" "../assets/film/siflo-$lang.mp4" | awk '{print $5, $9}'
done
