"""Clip Brand Identity 4.0 sticker marks (PDF page 11) into transparent SVGs.

The sheet is outlined vectors on a full-page taupe fill. This script drops that
fill and writes one SVG per mark into public/brand/stickers.
"""

from __future__ import annotations

import pymupdf
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "MakeHappn_Brand Identity 2025_Presentation.pdf"
OUT = ROOT / "public" / "brand" / "stickers"

# Ownership boxes in PDF points (page is 1920×1080). A drawing whose center
# falls in more than one box is given to the nearer box center.
REGIONS: dict[str, tuple[float, float, float, float]] = {
    "badge-thumbs": (70, 30, 280, 200),
    "binoculars": (520, 40, 1020, 195),
    "barcode": (1150, 20, 1580, 270),
    "laptop": (1580, 20, 1920, 340),
    "studio-card": (70, 200, 720, 450),
    "sticky-manifesto": (700, 190, 1220, 660),
    "meet-tape": (1180, 280, 1800, 410),
    "wordmark-sticker": (1180, 410, 1720, 610),
    "crafting-curating": (280, 450, 720, 700),
    "carrier": (1700, 450, 1920, 720),
    "dog": (60, 560, 240, 820),
    "checkerboard": (1180, 600, 1720, 750),
    "burst-script": (600, 730, 930, 1040),
    "spark": (1380, 740, 1760, 1080),
}

PAD = 8


def rgb(color: tuple[float, float, float] | None) -> str | None:
    if not color:
        return None
    return "#{:02x}{:02x}{:02x}".format(*(max(0, min(255, round(c * 255))) for c in color))


def fmt(n: float) -> str:
    return f"{n:.2f}".rstrip("0").rstrip(".")


def assign(center: pymupdf.Point) -> str | None:
    hits: list[tuple[float, str]] = []
    for name, (x0, y0, x1, y1) in REGIONS.items():
        if x0 <= center.x <= x1 and y0 <= center.y <= y1:
            cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
            hits.append(((center.x - cx) ** 2 + (center.y - cy) ** 2, name))
    if not hits:
        return None
    hits.sort()
    return hits[0][1]


def path_d(drawing: dict, ox: float, oy: float) -> str:
    parts: list[str] = []
    current: pymupdf.Point | None = None
    sub_start: pymupdf.Point | None = None

    def move(p: pymupdf.Point) -> None:
        nonlocal current, sub_start
        if sub_start is not None and drawing["type"] in ("f", "fs"):
            parts.append("Z")
        parts.append(f"M {fmt(p.x - ox)} {fmt(p.y - oy)}")
        current = p
        sub_start = p

    for item in drawing["items"]:
        kind = item[0]
        if kind == "l":
            p1, p2 = item[1], item[2]
            if current is None or abs(current.x - p1.x) > 0.05 or abs(current.y - p1.y) > 0.05:
                move(p1)
            parts.append(f"L {fmt(p2.x - ox)} {fmt(p2.y - oy)}")
            current = p2
        elif kind == "c":
            p1, p2, p3, p4 = item[1], item[2], item[3], item[4]
            if current is None or abs(current.x - p1.x) > 0.05 or abs(current.y - p1.y) > 0.05:
                move(p1)
            parts.append(
                f"C {fmt(p2.x - ox)} {fmt(p2.y - oy)} {fmt(p3.x - ox)} {fmt(p3.y - oy)} {fmt(p4.x - ox)} {fmt(p4.y - oy)}"
            )
            current = p4
        elif kind == "re":
            r = item[1]
            corners = [r.tl, r.tr, r.br, r.bl] if item[2] == 1 else [r.tl, r.bl, r.br, r.tr]
            move(corners[0])
            for p in corners[1:]:
                parts.append(f"L {fmt(p.x - ox)} {fmt(p.y - oy)}")
            current = corners[0]
        else:
            raise SystemExit(f"unsupported path item {kind}")

    if sub_start is not None and drawing["type"] in ("f", "fs"):
        parts.append("Z")
    return " ".join(parts)


def drawing_svg(drawing: dict, ox: float, oy: float) -> str:
    d = path_d(drawing, ox, oy)
    attrs = [f'd="{d}"']
    fill = rgb(drawing.get("fill"))
    stroke = rgb(drawing.get("color")) if drawing["type"] in ("s", "fs") else None
    if fill:
        attrs.append(f'fill="{fill}"')
        if drawing.get("fill_opacity") not in (None, 1):
            attrs.append(f'fill-opacity="{drawing["fill_opacity"]}"')
        if drawing.get("even_odd"):
            attrs.append('fill-rule="evenodd"')
    else:
        attrs.append('fill="none"')
    if stroke and drawing.get("width"):
        cap = {0: "butt", 1: "round", 2: "square"}.get(drawing.get("lineCap"), "butt")
        join = {0: "miter", 1: "round", 2: "bevel"}.get(drawing.get("lineJoin"), "miter")
        attrs.append(f'stroke="{stroke}"')
        attrs.append(f'stroke-width="{fmt(drawing["width"])}"')
        attrs.append(f'stroke-linecap="{cap}"')
        attrs.append(f'stroke-linejoin="{join}"')
    return f"<path {' '.join(attrs)}/>"


def main() -> None:
    doc = pymupdf.open(PDF)
    page = doc[10]
    groups: dict[str, list[dict]] = {name: [] for name in REGIONS}
    for drawing in page.get_drawings():
        rect = drawing["rect"]
        if rect.width > 1500 or rect.height > 900:
            continue
        name = assign(pymupdf.Point(rect.x0 + rect.width / 2, rect.y0 + rect.height / 2))
        if name:
            groups[name].append(drawing)

    OUT.mkdir(parents=True, exist_ok=True)
    for name, drawings in groups.items():
        if not drawings:
            raise SystemExit(f"{name} captured no drawings")
        bounds = pymupdf.Rect(drawings[0]["rect"])
        for drawing in drawings[1:]:
            bounds.include_rect(drawing["rect"])
        ox, oy = bounds.x0 - PAD, bounds.y0 - PAD
        width, height = bounds.width + PAD * 2, bounds.height + PAD * 2
        body = "\n  ".join(drawing_svg(d, ox, oy) for d in drawings)
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(width)} {fmt(height)}" '
            f'fill="none">\n  {body}\n</svg>\n'
        )
        (OUT / f"{name}.svg").write_text(svg, encoding="utf-8")
        print(f"{name:20} drawings={len(drawings):3d}  {width:.0f}x{height:.0f}")


if __name__ == "__main__":
    main()
