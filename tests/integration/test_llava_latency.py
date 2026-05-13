"""Quick LLaVA latency test with full validation prompt."""
import cv2, base64, requests, time, glob, os, sys

sys.path.insert(0, "src")

from loguru import logger
logger.disable("agrianalyze")

# Find a test image
imgs = glob.glob("data/training/test/**/*.jpg", recursive=True)
if not imgs:
    imgs = glob.glob("data/training/test/**/*.png", recursive=True)
print(f"Found {len(imgs)} test images, using first one: {imgs[0]}")

img = cv2.imread(imgs[0])
img = cv2.resize(img, (224, 224))
_, enc = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 85])
b64 = base64.b64encode(enc.tobytes()).decode()
print(f"Image size: {len(b64)} bytes b64")

# Test with structured prompt (similar to validation)
prompt = (
    "You are an expert plant pathologist. Is this rice crop healthy or diseased? "
    "If diseased, name the disease. Respond with JSON containing: diagnosis, confidence (0-1), is_healthy (bool)"
)

t0 = time.time()
try:
    r = requests.post('http://localhost:11434/api/chat', json={
        'model': 'llava',
        'messages': [{'role': 'user', 'content': prompt, 'images': [b64]}],
        'stream': False,
    }, timeout=600)
    dt = time.time() - t0
    msg = r.json()["message"]["content"]
    print(f"LLaVA latency: {dt:.1f}s")
    print(f"Response length: {len(msg)} chars")
    print(f"Response: {msg[:500]}")
except Exception as e:
    dt = time.time() - t0
    print(f"Error after {dt:.1f}s: {e}")
