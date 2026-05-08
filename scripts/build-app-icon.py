#!/usr/bin/env python3
"""Generate the iOS app icon from a source image.

- Reads the source PNG (any size)
- Samples the brand red from inside the red shape
- Flood-fills the white BACKGROUND (white pixels connected to the image edges)
  with the brand red — this preserves the white "C" in the middle.
- Resizes to 1024×1024
- Writes to ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png
"""
from __future__ import annotations

import sys
from pathlib import Path
from collections import deque
from PIL import Image

SOURCE = Path(sys.argv[1] if len(sys.argv) > 1 else "/Users/zondamac/Downloads/icon-2.png")
OUT_DIR = Path(__file__).resolve().parent.parent / "ios/App/App/Assets.xcassets/AppIcon.appiconset"
OUT_FILE = OUT_DIR / "AppIcon-512@2x.png"

img = Image.open(SOURCE).convert("RGB")
w, h = img.size
print(f"Source: {SOURCE}  ({w}×{h})")

# Sample the brand red from inside the red rounded square (above the C).
sample_x, sample_y = int(w * 0.35), int(h * 0.25)
brand_red = img.getpixel((sample_x, sample_y))
print(f"Sampled brand red @ ({sample_x},{sample_y}): rgb{brand_red}")

WHITE_THRESHOLD = 235

def is_white(rgb: tuple[int, int, int]) -> bool:
    return rgb[0] >= WHITE_THRESHOLD and rgb[1] >= WHITE_THRESHOLD and rgb[2] >= WHITE_THRESHOLD

# Flood-fill from every edge pixel that's white. This catches the entire white
# background but never reaches the white "C" (which is surrounded by red).
pixels = img.load()
visited = bytearray(w * h)  # 0 = unvisited, 1 = visited
queue: deque[tuple[int, int]] = deque()

# Seed the queue with all white pixels along the four edges.
for x in range(w):
    if is_white(pixels[x, 0]):
        queue.append((x, 0)); visited[x] = 1
    if is_white(pixels[x, h - 1]):
        queue.append((x, h - 1)); visited[(h - 1) * w + x] = 1
for y in range(h):
    if is_white(pixels[0, y]):
        queue.append((0, y)); visited[y * w] = 1
    if is_white(pixels[w - 1, y]):
        queue.append((w - 1, y)); visited[y * w + (w - 1)] = 1

filled = 0
while queue:
    x, y = queue.popleft()
    pixels[x, y] = brand_red
    filled += 1
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h:
            idx = ny * w + nx
            if not visited[idx] and is_white(pixels[nx, ny]):
                visited[idx] = 1
                queue.append((nx, ny))

print(f"Flood-filled {filled:,} background pixels with brand red")

# Resize to 1024×1024 (Apple's master icon size)
icon = img.resize((1024, 1024), Image.LANCZOS)

OUT_DIR.mkdir(parents=True, exist_ok=True)
icon.save(OUT_FILE, "PNG", optimize=True)
print(f"Wrote {OUT_FILE}")
