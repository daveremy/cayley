#!/usr/bin/env python3
"""Cross product + right-hand rule — hybrid infographic.

The vector panel is computed, not drawn: a and b are declared perpendicular and
the orange arrow is literally np.cross(a, b). The geometry cannot be wrong.

The hand is lifted from an OpenAI/Codex generation, which drew it correctly —
hands are hard to draw and easy to verify, which is exactly the split worth
making. Generated art for what is hard to draw; deterministic code for anything
where being wrong would teach the wrong thing.

Both AI attempts drew a and b at ~150 degrees while placing a right-angle marker
between them. Neither noticed. That is the failure this file exists to avoid.
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
from PIL import Image

INK, MUTE = "#14213d", "#6b6b7b"
GREEN, ORANGE = "#1b7f4b", "#e8590c"
HERE = __file__.rsplit("/", 1)[0]

# ── the mathematics, declared once ───────────────────────────────────────────
a = np.array([1.0, 0.0, 0.0])
b = np.array([0.0, 1.0, 0.0])
c = np.cross(a, b)                      # ← the arrow is computed, not chosen

assert abs(np.dot(a, b)) < 1e-12, "a and b must be perpendicular"
assert abs(np.dot(a, c)) < 1e-12 and abs(np.dot(b, c)) < 1e-12
assert np.allclose(c, [0, 0, 1])

# ── left panel: the geometry ─────────────────────────────────────────────────
fig = plt.figure(figsize=(7.6, 6.4), dpi=200)
ax = fig.add_subplot(111, projection="3d")
ax.set_axis_off()
ax.set_box_aspect((1, 1, 0.95))
ax.view_init(elev=22, azim=-58)
fig.patch.set_facecolor("white")

# the plane a and b span
pts = np.array([[0, 0, 0], a, a + b, b])
ax.add_collection3d(Poly3DCollection([pts], facecolor="#eef2f8",
                                     edgecolor="#c3cddc", lw=1.2, alpha=0.9))

def arrow(vec, color, label, lw=3.4, off=0.16):
    ax.quiver(0, 0, 0, *vec, color=color, lw=lw, arrow_length_ratio=0.14)
    ax.text(*(vec * (1 + off)), label, color=color, fontsize=19,
            fontweight="bold", style="italic", ha="center", va="center")

arrow(a, GREEN, "a")
arrow(b, GREEN, "b")
arrow(c, ORANGE, "a × b")

# right-angle markers that are actually right angles
s = 0.14
for u, v in [(a, b), (a, c), (b, c)]:
    sq = np.array([u * s, u * s + v * s, v * s])
    ax.plot(*sq.T, color=MUTE, lw=1.3)

ax.set_xlim(-0.15, 1.25); ax.set_ylim(-0.15, 1.25); ax.set_zlim(0, 1.3)

panel = f"{HERE}/_vectors.png"
plt.savefig(panel, facecolor="white", bbox_inches="tight", pad_inches=0.05)
plt.close()

# ── composite: computed vectors + generated hand ─────────────────────────────
vec = Image.open(panel).convert("RGB")
hand = Image.open(f"{HERE}/cross-product-rhr-codex.png").convert("RGB").crop((930, 20, 1536, 800))

H = 760
vec = vec.resize((int(vec.width * H / vec.height), H), Image.LANCZOS)
hand = hand.resize((int(hand.width * H / hand.height), H), Image.LANCZOS)

PAD, TOP, BOT = 40, 130, 250
W = vec.width + hand.width + PAD * 3
canvas = Image.new("RGB", (W, H + TOP + BOT), "white")
canvas.paste(vec, (PAD, TOP))
canvas.paste(hand, (PAD * 2 + vec.width, TOP))

from PIL import ImageDraw, ImageFont
d = ImageDraw.Draw(canvas)

def font(sz, bold=False, mono=False, italic=False):
    p = ("/System/Library/Fonts/Menlo.ttc" if mono else
         "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else
         "/System/Library/Fonts/Supplemental/Arial Italic.ttf" if italic else
         "/System/Library/Fonts/Supplemental/Arial.ttf")
    try:    return ImageFont.truetype(p, sz)
    except: return ImageFont.load_default()

def centered(text, y, f, fill):
    d.text(((W - d.textlength(text, font=f)) / 2, y), text, font=f, fill=fill)

centered("the cross product  ·  the right-hand rule", 30, font(46, bold=True), INK)
centered("two vectors in, a third one out — perpendicular to both", 86, font(22, italic=True), MUTE)

# captions under each panel, clear of both the subtitle and the artwork
capy = TOP + H - 6
def under(x0, w, line1, line2, c1, c2):
    for txt, f, fill, dy in [(line1, font(20, bold=True), c1, 0), (line2, font(18, italic=True), c2, 28)]:
        d.text((x0 + (w - d.textlength(txt, font=f)) / 2, capy + dy), txt, font=f, fill=fill)

under(PAD, vec.width, "COMPUTED, NOT DRAWN", "a · b = 0 — asserted, then plotted", GREEN, MUTE)
under(PAD * 2 + vec.width, hand.width, "GENERATED, THEN CHECKED", "hands are hard to draw, easy to verify", INK, MUTE)

y = TOP + H + 96
eq = font(31, mono=True)
gap = W / 4
for i, t in enumerate(["i × j = k", "j × i = −k", "a × b = −(b × a)"]):
    d.text((gap * (i + 0.5) - d.textlength(t, font=eq) / 2 + gap * 0.25, y), t, font=eq, fill=INK)
centered("swap the order and the thumb flips", y + 58, font(24, italic=True), MUTE)
centered("index = a    ·    middle = b    ·    thumb = a × b", y + 104, font(21), GREEN)

out = f"{HERE}/cross-product-rhr-hybrid.png"
canvas.save(out)
import os; os.remove(panel)
print("wrote", out, canvas.size)
