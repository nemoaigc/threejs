#!/usr/bin/env python3
"""Generate an image via the betteryeah AI gateway (gpt-image-2), optionally
flood-fill the flat background to alpha, autocrop, and save a PNG sprite.

Usage:
  python3 scripts/genimg.py --prompt "..." --out src/assets/tree.png --key white
Env (from .env): BTY_API_KEY, BTY_IMAGE_URL
"""
import argparse, base64, json, os, sys, urllib.request
from collections import deque

def load_env(path='.env'):
    if os.path.exists(path):
        for line in open(path):
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ.setdefault(k, v)

def generate(prompt, size, quality):
    url = os.environ['BTY_IMAGE_URL']
    key = os.environ['BTY_API_KEY']
    body = json.dumps({'model': 'gpt-image-2', 'prompt': prompt, 'n': 1,
                       'size': size, 'quality': quality}).encode()
    req = urllib.request.Request(url, data=body, headers={
        'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=300) as r:
        d = json.load(r)
    return base64.b64decode(d['data'][0]['b64_json'])

def key_background(img_bytes, out_path, tol):
    from PIL import Image
    import io
    im = Image.open(io.BytesIO(img_bytes)).convert('RGBA')
    w, h = im.size
    px = im.load()
    corners = [px[0, 0], px[w-1, 0], px[0, h-1], px[w-1, h-1]]
    bg = tuple(sum(c[i] for c in corners)//4 for i in range(3))
    near = lambda c: all(abs(c[i]-bg[i]) <= tol for i in range(3))
    seen = [[False]*w for _ in range(h)]
    q = deque()
    for x in range(w):
        for y in (0, h-1):
            if near(px[x, y]): q.append((x, y)); seen[y][x] = True
    for y in range(h):
        for x in (0, w-1):
            if near(px[x, y]) and not seen[y][x]: q.append((x, y)); seen[y][x] = True
    while q:
        x, y = q.popleft()
        r, g, b, _ = px[x, y]
        px[x, y] = (r, g, b, 0)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x+dx, y+dy
            if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and near(px[nx, ny]):
                seen[ny][nx] = True; q.append((nx, ny))
    bbox = im.getbbox()
    im = im.crop(bbox)
    pad = int(0.04*max(im.size))
    out = Image.new('RGBA', (im.size[0]+2*pad, im.size[1]+2*pad), (0, 0, 0, 0))
    out.paste(im, (pad, pad))
    out.save(out_path)
    return out.size

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--prompt', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--size', default='1024x1024')
    ap.add_argument('--quality', default='medium')
    ap.add_argument('--key', choices=['none', 'white', 'auto'], default='none')
    ap.add_argument('--tol', type=int, default=40)
    a = ap.parse_args()
    load_env()
    os.makedirs(os.path.dirname(a.out) or '.', exist_ok=True)
    img = generate(a.prompt, a.size, a.quality)
    if a.key == 'none':
        open(a.out, 'wb').write(img)
        print(f'[{a.out}] saved (opaque)')
    else:
        sz = key_background(img, a.out, a.tol)
        print(f'[{a.out}] saved {sz} aspect(w/h)={sz[0]/sz[1]:.4f}')

if __name__ == '__main__':
    main()
