#!/usr/bin/env bash
# Dev-time: turn the pancake reference video into the hero's scroll frame sequence.
# Usage: bash tools/build_pancake.sh
# The source is a screen recording on a laptop, so every frame is cropped to the
# inside of the screen (960x605 at 125,85 — clean on all 97 frames).
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=assets/photos/source/pancake-reference.mp4
OUT=assets/pancake
CROP="crop=960:605:125:85"
rm -rf "$OUT"; mkdir -p "$OUT/d" "$OUT/m"
# Desktop: native crop size (no upscaling). Mobile: 720 wide.
ffmpeg -v error -i "$SRC" -an -vf "$CROP" -c:v libwebp -quality 72 -compression_level 6 -start_number 0 "$OUT/d/f_%03d.webp"
ffmpeg -v error -i "$SRC" -an -vf "$CROP,scale=720:-2:flags=lanczos" -c:v libwebp -quality 68 -compression_level 6 -start_number 0 "$OUT/m/f_%03d.webp"
ls "$OUT/d" | wc -l; du -sh "$OUT/d" "$OUT/m"
