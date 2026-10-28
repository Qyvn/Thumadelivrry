"""Duban grade for owner-supplied photos. Pillow + OpenCV only; no generative edits.
Originals: assets/originals/ (not deployed). Outputs WebP to public/images/duban/ and site/images/duban/."""
import os, cv2, numpy as np
from PIL import Image, ImageFilter, ImageEnhance

SRC = "assets/originals"
OUTS = ["public/images/duban", "site/images/duban"]
PREV = "assets/edited-previews"  # full-size graded JPGs for comparisons (not deployed)
for d in OUTS + [PREV]:
    os.makedirs(d, exist_ok=True)

# Privacy regions in ORIGINAL pixel coords (x0,y0,x1,y1) — plates get strong blur, faces soft blur.
PRIVACY = {
    "umhlanga-night": {
        "plates": [(36, 1300, 160, 1352), (192, 1218, 262, 1252), (490, 1176, 532, 1204)],
        "faces": [(700, 1104, 736, 1144), (905, 1218, 940, 1262)],
    },
    "ushaka-gate": {"plates": [], "faces": [(736, 1322, 772, 1362), (862, 1332, 896, 1372)]},
    "durban-letters": {"plates": [], "faces": [(50, 408, 92, 452)]},
    "promenade": {"plates": [], "faces": []},
}
# Focal point (fx, fy) as fraction for crops
FOCUS = {
    "promenade": (0.5, 0.42),
    "durban-letters": (0.48, 0.55),
    "ushaka-gate": (0.5, 0.35),
    "umhlanga-night": (0.5, 0.56),
}
# Per-crop focus overrides
FOCUS_CROP = {("promenade", "hero-wide"): (0.5, 0.2), ("promenade", "card"): (0.5, 0.3)}
ROTATE = {"promenade": 0.0, "durban-letters": 0.0, "ushaka-gate": 0.0, "umhlanga-night": 0.0}

def blur_box(img, box, k):
    x0, y0, x1, y1 = box
    region = img.crop(box).filter(ImageFilter.GaussianBlur(k))
    if k >= 10:  # plates: pixelate too so text is unrecoverable
        w, h = region.size
        region = region.resize((max(1, w // 10), max(1, h // 10)), Image.BILINEAR).resize((w, h), Image.NEAREST).filter(ImageFilter.GaussianBlur(3))
    img.paste(region, box)

def grade(img, night=False):
    arr = np.asarray(img).astype(np.float32) / 255.0
    if night:
        bgr = cv2.cvtColor((arr * 255).astype(np.uint8), cv2.COLOR_RGB2BGR)
        bgr = cv2.fastNlMeansDenoisingColored(bgr, None, 6, 6, 7, 21)
        arr = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    # gentle S-curve contrast
    arr = 0.5 + (arr - 0.5) * 1.08
    arr = np.clip(arr, 0, 1)
    # warm highlights (sunset), cooler-teal shadows
    lum = arr.mean(axis=2, keepdims=True)
    hi = np.clip((lum - 0.55) / 0.45, 0, 1)
    arr = arr + hi * np.array([0.045, 0.018, -0.03])
    lo = np.clip((0.4 - lum) / 0.4, 0, 1)
    arr = arr + lo * np.array([-0.01, 0.008, 0.02])
    arr = np.clip(arr, 0, 1)
    # richer blues/greens via HSV saturation boost on those hues
    hsv = cv2.cvtColor((arr * 255).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32)
    h = hsv[..., 0]
    mask = ((h >= 35) & (h <= 130)).astype(np.float32)  # greens..blues (OpenCV 0-180)
    hsv[..., 1] = np.clip(hsv[..., 1] * (1 + 0.16 * mask + 0.05), 0, 255)
    arr = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB)
    out = Image.fromarray(arr)
    # clarity (local contrast) + light sharpen
    out = out.filter(ImageFilter.UnsharpMask(radius=12, percent=18, threshold=2))
    out = out.filter(ImageFilter.UnsharpMask(radius=1.2, percent=55 if not night else 35, threshold=3))
    return out

def crop_ratio(img, ratio, focus):
    W, H = img.size
    if W / H > ratio:
        h, w = H, int(round(H * ratio))
    else:
        w, h = W, int(round(W / ratio))
    cx, cy = focus[0] * W, focus[1] * H
    x0 = int(min(max(cx - w / 2, 0), W - w))
    y0 = int(min(max(cy - h / 2, 0), H - h))
    return img.crop((x0, y0, x0 + w, y0 + h))

CROPS = {
    "hero-wide": (16 / 9, [768, 1280, 1920]),
    "hero-tall": (9 / 16, [480, 720, 1080]),
    "card": (4 / 5, [400, 800]),
    "tile": (1.0, [400, 800]),
}

report = []
for name in ["promenade", "durban-letters", "ushaka-gate", "umhlanga-night"]:
    img = Image.open(f"{SRC}/{name}.jpg").convert("RGB")
    if ROTATE[name]:
        img = img.rotate(ROTATE[name], resample=Image.BICUBIC, expand=False)
    for b in PRIVACY[name]["plates"]:
        blur_box(img, b, 14)
    for b in PRIVACY[name]["faces"]:
        blur_box(img, b, 6)
    g = grade(img, night=(name == "umhlanga-night"))
    g.save(f"{PREV}/{name}-graded.jpg", quality=90)
    for crop, (ratio, widths) in CROPS.items():
        c = crop_ratio(g, ratio, FOCUS_CROP.get((name, crop), FOCUS[name]))
        for w in widths:
            # upscale at most 1.6x; beyond that cap at what the source supports
            target = min(w, int(c.width * 1.6))
            h = int(round(target / ratio))
            r = c.resize((target, h), Image.LANCZOS)
            for d in OUTS:
                r.save(f"{d}/{name}-{crop}-{w}.webp", "WEBP", quality=80, method=5)
            report.append((name, crop, w, target, c.width))
    # OG image for #DURBAN
    if name == "durban-letters":
        og = crop_ratio(g, 1200 / 630, FOCUS[name]).resize((1200, 630), Image.LANCZOS)
        og.save("public/og-duban.jpg", quality=86)
        og.save("site/images/og-duban.jpg", quality=86)

for r in report:
    if r[3] < r[2]:
        print(f"capped {r[0]} {r[1]} {r[2]} -> {r[3]}px (source crop {r[4]}px)")
print("done", len(report), "variants")
