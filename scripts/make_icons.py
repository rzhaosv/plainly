#!/usr/bin/env python3
"""Plainly icons: deep plum ground, two overlapping speech shapes (one rounded, one squared) that
share a common middle, i.e. two different minds meeting plainly. No text.
  python3 scripts/make_icons.py
"""
import os
from PIL import Image, ImageDraw, ImageFilter
ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets")
PLUM = (58, 40, 84); PLUM_DEEP = (36, 24, 56)
LILAC = (196, 176, 232); CORAL = (245, 150, 120); CREAM = (250, 244, 236)

def bg(size):
    img = Image.new("RGB", (size, size), PLUM_DEEP)
    d = ImageDraw.Draw(img)
    cx, cy = size * 0.45, size * 0.38
    for i in range(40, 0, -1):
        t = i / 40; r = size * 0.7 * t
        c = tuple(int(PLUM_DEEP[k] + (PLUM[k] - PLUM_DEEP[k]) * (1 - t)) for k in range(3))
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c)
    return img

def marks(size, transparent, mono=False, scale=1.0):
    u = size / 1024 * scale
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0)) if transparent else bg(size).convert("RGBA")
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    # left: rounded bubble (lilac)   right: squared bubble (coral)   overlap: cream
    a = [size/2 - 330*u, size/2 - 250*u, size/2 + 90*u, size/2 + 170*u]
    b = [size/2 - 90*u, size/2 - 170*u, size/2 + 330*u, size/2 + 250*u]
    la = CREAM if mono else LILAC; lb = CREAM if mono else CORAL
    d.ellipse(a, fill=la + (255,))
    d.rounded_rectangle(b, radius=70*u, fill=lb + (255,))
    # tails
    d.polygon([(a[0]+70*u, a[3]-40*u), (a[0]+30*u, a[3]+90*u), (a[0]+170*u, a[3]-10*u)], fill=la + (255,))
    d.polygon([(b[2]-70*u, b[1]+40*u), (b[2]-30*u, b[1]-90*u), (b[2]-170*u, b[1]+10*u)], fill=lb + (255,))
    if not mono:
        # shared middle
        inter = Image.new("L", (size, size), 0); di = ImageDraw.Draw(inter)
        di.ellipse(a, fill=255)
        m2 = Image.new("L", (size, size), 0); ImageDraw.Draw(m2).rounded_rectangle(b, radius=70*u, fill=255)
        from PIL import ImageChops
        both = ImageChops.multiply(inter, m2)
        cream = Image.new("RGBA", (size, size), CREAM + (255,))
        layer.paste(cream, (0, 0), both)
    if not transparent:
        sh = layer.split()[3].filter(ImageFilter.GaussianBlur(28*u))
        shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0)); shadow.putalpha(sh.point(lambda v: int(v*0.35)))
        canvas.alpha_composite(shadow, (0, int(26*u)))
    canvas.alpha_composite(layer)
    return canvas

os.makedirs(ROOT, exist_ok=True)
marks(1024, False).convert("RGB").save(os.path.join(ROOT, "icon.png"))
marks(1024, True, scale=0.78).save(os.path.join(ROOT, "adaptive-icon.png"))
marks(1024, True, scale=0.9).save(os.path.join(ROOT, "splash-icon.png"))
marks(96, True, mono=True, scale=0.95).save(os.path.join(ROOT, "notification-icon.png"))
marks(64, False).convert("RGB").save(os.path.join(ROOT, "favicon.png"))
print("icons written")
