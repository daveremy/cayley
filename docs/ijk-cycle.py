#!/usr/bin/env python3
"""The ijk cycle — six quaternion facts as one rule.

Built for Dave, 2026-07-28, while filling in Q8's arrows (issue #1).
Forward around the circle is positive; backward is negative."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyArrowPatch
import numpy as np

INK, MUTE, GREY = "#1a1a2e", "#6b6b7b", "#c9ccd6"
GREEN, RED, BLUE = "#1b7f4b", "#c0392b", "#2456a6"

fig, (ax, bx) = plt.subplots(1, 2, figsize=(15, 7.6), dpi=150,
                             gridspec_kw={"width_ratios": [1, 1.15]})
fig.patch.set_facecolor("white")
fig.text(0.5, 0.955, "i · j · k  —  six facts, one rule",
         ha="center", fontsize=22, fontweight="bold", color=INK)
fig.text(0.5, 0.905, "go around the circle:  with the arrows is POSITIVE, against them is NEGATIVE",
         ha="center", fontsize=12.5, color=MUTE, style="italic")

# ── left: the cycle ──────────────────────────────────────────────────────────
ax.set_xlim(-1.75, 1.75); ax.set_ylim(-1.95, 1.65); ax.set_aspect("equal"); ax.axis("off")

R = 1.05
pos = {name: (R*np.cos(np.radians(a)), R*np.sin(np.radians(a)))
       for name, a in [("i", 90), ("j", -30), ("k", 210)]}

# forward arcs i→j→k→i  (green, outside)
for a, b in [("i", "j"), ("j", "k"), ("k", "i")]:
    ax.add_patch(FancyArrowPatch(pos[a], pos[b], connectionstyle="arc3,rad=-0.28",
                 arrowstyle="-|>", mutation_scale=24, lw=3.2, color=GREEN,
                 shrinkA=30, shrinkB=30, zorder=2))
# backward arcs (red, inside, thinner)
for a, b in [("j", "i"), ("k", "j"), ("i", "k")]:
    ax.add_patch(FancyArrowPatch(pos[a], pos[b], connectionstyle="arc3,rad=-0.30",
                 arrowstyle="-|>", mutation_scale=17, lw=1.9, color=RED,
                 shrinkA=27, shrinkB=27, alpha=0.85, zorder=1))

for name, (x, y) in pos.items():
    ax.add_patch(Circle((x, y), 0.30, facecolor="white", edgecolor=INK, lw=3, zorder=4))
    ax.text(x, y, name, ha="center", va="center", fontsize=27,
            fontweight="bold", color=INK, style="italic", zorder=5)

ax.text(0, -1.45, "━━━▶", ha="center", fontsize=15, color=GREEN, fontweight="bold")
ax.text(0, -1.66, "forward  =  +", ha="center", fontsize=13, color=GREEN, fontweight="bold")
ax.text(0, -1.86, "backward  =  −", ha="center", fontsize=13, color=RED, fontweight="bold")

# ── right: the rules ─────────────────────────────────────────────────────────
bx.set_xlim(0, 10); bx.set_ylim(0, 10); bx.axis("off")

def block(y, title, color, lines):
    bx.text(0.2, y, title, fontsize=13, fontweight="bold", color=color)
    for k, ln in enumerate(lines):
        bx.text(0.7, y - 0.62 - k*0.58, ln, fontsize=14, color=INK, family="monospace")

block(9.5, "FORWARD  (with the arrows)", GREEN,
      ["i · j  =  k", "j · k  =  i", "k · i  =  j"])
block(7.0, "BACKWARD  (against them)", RED,
      ["j · i  =  −k", "k · j  =  −i", "i · k  =  −j"])
block(4.5, "SQUARES", BLUE,
      ["i · i  =  j · j  =  k · k  =  −1"])
block(3.0, "MINUS SIGNS PULL STRAIGHT OUT", MUTE,
      ["(−i) · j    =  −(i · j)  =  −k",
       "(−i) · (−j) =    i · j   =   k"])

bx.text(0.2, 0.75, "same three letters every time.", fontsize=12, color=INK, style="italic")
bx.text(0.2, 0.28, "only the DIRECTION decides the sign.", fontsize=12, color=GREEN,
        style="italic", fontweight="bold")

fig.text(0.5, 0.035,
         "if you have done 3D graphics you already know this — it is the cross product, i × j = k, right-hand rule",
         ha="center", fontsize=11, color=MUTE, style="italic")

plt.subplots_adjust(top=0.87, bottom=0.09, left=0.03, right=0.97, wspace=0.05)
out = __file__.rsplit("/", 1)[0] + "/ijk-cycle.png"
plt.savefig(out, facecolor="white", bbox_inches="tight")
print("wrote", out)
