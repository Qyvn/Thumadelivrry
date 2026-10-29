"""Duban photos v2: privacy blur -> gentle denoise -> EDSR super-res (if small) -> Duban cool grade -> crops -> WebP.
No generative edits; nothing added/removed. Run with a Python that has opencv-contrib (dnn_superres) + Pillow.
Owner originals: assets/originals/*.jpg. Commons: downloaded from Special:FilePath (see docs/image-credits.md) to COMMONS dir."""
import cv2, numpy as np, os, sys, importlib.util
from PIL import Image, ImageFilter
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("v1", os.path.join(ROOT, "scripts/edit-owner-photos.py"))
OUT = os.path.join(ROOT, "site/images/v2"); COMMONS = sys.argv[1] if len(sys.argv) > 1 else "/tmp/commons"
MODELS = {2: "/tmp/EDSR_x2.pb", 3: "/tmp/EDSR_x3.pb"}
# Same privacy boxes as v1 (original pixel coords)
PRIVACY = {
    "umhlanga-night": {"plates": [(36, 1300, 160, 1352), (192, 1218, 262, 1252), (490, 1176, 532, 1204)],
                       "faces": [(700, 1104, 736, 1144), (905, 1218, 940, 1262)]},
    "ushaka-gate": {"plates": [], "faces": [(736, 1322, 772, 1362), (862, 1332, 896, 1372)]},
    "durban-letters": {"plates": [], "faces": [(50, 408, 92, 452)]},
    "promenade": {"plates": [], "faces": []},
}
FOCUS = {"promenade": (0.5, 0.3), "durban-letters": (0.48, 0.55), "ushaka-gate": (0.5, 0.35), "umhlanga-night": (0.5, 0.56)}

def blur_box(img, box, k):
    region = img.crop(box).filter(ImageFilter.GaussianBlur(k))
    if k >= 10:
        w, h = region.size
        region = region.resize((max(1, w // 10), max(1, h // 10)), Image.BILINEAR).resize((w, h), Image.NEAREST).filter(ImageFilter.GaussianBlur(3))
    img.paste(region, box)

def superres(bgr, need):
    if need <= 1.05: return bgr
    s = 3 if need > 2 else 2
    sr = cv2.dnn_superres.DnnSuperResImpl_create(); sr.readModel(MODELS[s]); sr.setModel("edsr", s)
    return sr.upsample(bgr)

def grade(bgr, night=False):
    bgr = cv2.fastNlMeansDenoisingColored(bgr, None, 6 if night else 3, 6 if night else 3, 7, 21)
    a = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB).astype(np.float32) / 255
    # clean whites: neutralise highlight cast toward white
    lum = a.mean(2, keepdims=True); hi = np.clip((lum - 0.7) / 0.3, 0, 1)
    a = a * (1 - 0.35 * hi) + lum * 0.35 * hi
    a = np.clip(0.5 + (a - 0.5) * 1.07, 0, 1)                               # a little contrast
    lo = np.clip((0.45 - lum) / 0.45, 0, 1); a = a + lo * np.array([-0.02, 0.012, 0.03])   # teal shadows
    a = np.clip(a, 0, 1)
    hsv = cv2.cvtColor((a * 255).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32)
    m = ((hsv[..., 0] >= 80) & (hsv[..., 0] <= 125)).astype(np.float32)   # cyan..ocean blue
    hsv[..., 1] = np.clip(hsv[..., 1] * (1 + 0.14 * m), 0, 255)
    return Image.fromarray(cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB)).filter(ImageFilter.UnsharpMask(10, 14, 2))

def crop_ratio(img, ratio, focus):
    W, H = img.size
    w, h = (int(H * ratio), H) if W / H > ratio else (W, int(W / ratio))
    x0 = int(min(max(focus[0] * W - w / 2, 0), W - w)); y0 = int(min(max(focus[1] * H - h / 2, 0), H - h))
    return img.crop((x0, y0, x0 + w, y0 + h))

def export(img, name, widths, ratio=None, focus=(0.5, 0.5)):
    c = crop_ratio(img, ratio, focus) if ratio else img
    out = []
    for w in widths:
        w2 = min(w, c.width); h = round(w2 * c.height / c.width)
        r = c.resize((w2, h), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.0, 60, 2))
        r.save(f"{OUT}/{name}-{w}.webp", "WEBP", quality=82, method=6); out.append((f"{name}-{w}.webp", w2, h))
    return out

log = []
for n in PRIVACY:
    im = Image.open(f"{ROOT}/assets/originals/{n}.jpg").convert("RGB")
    for b in PRIVACY[n]["plates"]: blur_box(im, b, 14)
    for b in PRIVACY[n]["faces"]: blur_box(im, b, 6)
    bgr = cv2.cvtColor(np.asarray(im), cv2.COLOR_RGB2BGR)
    need = (1600 / im.width) if n == "promenade" else (800 / im.width)
    g = grade(superres(bgr, need), night=(n == "umhlanga-night"))
    log += export(g, f"{n}-card", [400, 800], 4 / 5, FOCUS[n])
    if n == "promenade":
        log += export(g, "promenade-hero-tall", [720, 1080, 1440], 9 / 16, (0.5, 0.42))
        log += export(g, "promenade-hero-wide", [1280, 1600, 1920], 16 / 9, (0.5, 0.2))
for n in ["mabhida", "victoria-market", "botanic", "thousand-hills", "florida-road"]:
    im = Image.open(f"{COMMONS}/{n}.jpg").convert("RGB")
    bgr = cv2.cvtColor(np.asarray(im), cv2.COLOR_RGB2BGR)
    if im.width > 2400: bgr = cv2.resize(bgr, (2400, round(2400 * im.height / im.width)), interpolation=cv2.INTER_AREA)
    g = grade(superres(bgr, 1600 / bgr.shape[1]))
    log += export(g, n, [400, 800, 1600])
for l in log: print(*l)
