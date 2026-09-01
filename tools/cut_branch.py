#!/usr/bin/env python3
"""Key the cherry branch off its chroma-green background.

Three things this gets right that the earlier cuts did not:

  * ALPHA COMES FROM GREEN DOMINANCE, NOT RGB DISTANCE. An edge pixel is a
    mix, observed = a·branch + (1−a)·key. For a neutral-ish subject — white
    blossom, dark twig — the "spill" measure G − max(R, B) is ~0 on the
    branch and ~131 on the key, so spill(observed) ≈ (1−a)·131 and the
    alpha falls straight out, linear in the mix. Euclidean distance from the
    key is not linear in the mix, so it under-covered every thin twig.

  * NO MEDIAN FILTER. A 3×3 median on the alpha erases any line one pixel
    wide, and the finest twigs are exactly that. That is where the branch
    kept losing its tips.

  * COLOUR IS RECOVERED, NOT SAMPLED. Where alpha is high, divide the key
    back out. Where it is low, that division only amplifies noise, so the
    colour is borrowed from the solid neighbourhood instead (premultiplied
    blur ÷ blurred alpha), which is what stops the soft edges going grey.

Writes public/plates/branch.webp at the source's full 2048px width — the
old 1600px cut was upscaled on every retina display.
"""
from PIL import Image
import numpy as np
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT.parent / "hero/assets/plates/branch-green.png"
OUT = ROOT / "public/plates/branch.webp"
PREVIEW = ROOT / "screenshots/branch-preview.png"

# Alpha toe and shoulder, as fractions of the key's own spill. Below the toe
# is background noise; above the shoulder is solid branch.
TOE, SHOULDER = 0.07, 0.94
# Radius over which solid colour is spread into the soft edges.
EXTEND_RADIUS = 6.0
# Radius of the local key estimate — wide enough to see past a blossom
# cluster to the screen behind it, small enough to follow the vignette.
KEY_RADIUS = 40.0
# Alpha range over which we switch from borrowed colour to the exact division.
TRUST_LO, TRUST_HI = 0.35, 0.8
# Green is capped at the red/blue average plus this: real blossom never
# carries more green than that, but pale pink carries a little.
SPILL_MARGIN = 6.0
# Backlit grade: isolated on green the blossom lights warm and beige, but
# against sky it should read cool and translucent.
LIFT = np.array([26.0, 28.0, 46.0])


def gaussian(arr: np.ndarray, sigma: float) -> np.ndarray:
    """Separable Gaussian in float, with edge replication."""
    r = int(3 * sigma)
    x = np.arange(-r, r + 1)
    k = np.exp(-(x * x) / (2 * sigma * sigma))
    k /= k.sum()

    def along(a: np.ndarray, axis: int) -> np.ndarray:
        pad = [(0, 0)] * a.ndim
        pad[axis] = (r, r)
        p = np.pad(a, pad, mode="edge")
        return np.apply_along_axis(lambda v: np.convolve(v, k, mode="valid"), axis, p)

    return along(along(arr, 0), 1)


im = Image.open(SRC).convert("RGB")
a = np.asarray(im).astype(np.float32)

# The screen is not one green. It vignettes toward the edges — the bottom
# row is ten points darker than the top-left corner — and a single sampled
# key left every border row a few percent opaque, which drew a hairline at
# the bottom of the branch layer on phones. So the key is estimated LOCALLY:
# a wide blur of the source over pixels that are plainly background, so each
# pixel is compared with the green around it rather than the green far away.
spill = a[..., 1] - np.maximum(a[..., 0], a[..., 2])
corner = a[:60, :60].reshape(-1, 3).mean(0)
corner_spill = corner[1] - max(corner[0], corner[2])
background = (spill > 0.7 * corner_spill).astype(np.float32)
weight = np.maximum(gaussian(background, KEY_RADIUS), 1e-3)
key = gaussian(a * background[..., None], KEY_RADIUS) / weight[..., None]
key_spill = np.maximum(key[..., 1] - np.maximum(key[..., 0], key[..., 2]), 1.0)

raw = np.clip(1.0 - spill / key_spill, 0.0, 1.0)
alpha = np.clip((raw - TOE) / (SHOULDER - TOE), 0.0, 1.0)

# Exact where alpha is high, noise where it is low.
safe = np.maximum(alpha, 0.02)[..., None]
direct = np.clip((a - (1.0 - alpha[..., None]) * key) / safe, 0, 255)

# Solid colour spread outward into the soft edges.
premult = direct * alpha[..., None]
extended = gaussian(premult, EXTEND_RADIUS) / np.maximum(gaussian(alpha, EXTEND_RADIUS), 1e-3)[..., None]
extended = np.clip(extended, 0, 255)

trust = np.clip((alpha - TRUST_LO) / (TRUST_HI - TRUST_LO), 0.0, 1.0)[..., None]
rgb = direct * trust + extended * (1.0 - trust)

neutral = (rgb[..., 0] + rgb[..., 2]) * 0.5
rgb[..., 1] = np.minimum(rgb[..., 1], neutral + SPILL_MARGIN)

luma = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
w = np.clip((luma - 90.0) / 120.0, 0.0, 1.0)[..., None]
rgb = np.clip(rgb + LIFT * w, 0, 255)

out = np.dstack([rgb.astype(np.uint8), (alpha * 255).astype(np.uint8)])
branch = Image.fromarray(out, mode="RGBA")
branch.save(OUT, "WEBP", quality=90, method=6)

# A preview over the sky's blue, for checking the cut by eye.
sky = Image.new("RGBA", branch.size, (34, 130, 210, 255))
sky.alpha_composite(branch)
PREVIEW.parent.mkdir(parents=True, exist_ok=True)
sky.convert("RGB").resize((1600, 900), Image.LANCZOS).save(PREVIEW)

soft = (alpha > 0.05) & (alpha < 0.95)
print(f"key colour : corner {corner.round(0)}, local range G {key[..., 1].min():.0f}–{key[..., 1].max():.0f}")
print(f"opaque     : {float((alpha > 0.5).mean()):.2%}")
print(f"any alpha  : {float((alpha > 0.02).mean()):.2%}   (thin twigs live here)")
print(f"soft edge  : {float(soft.mean()):.2%} of frame")
print(f"wrote {OUT.name} {branch.width}x{branch.height} {OUT.stat().st_size / 1024:.0f} KB")
