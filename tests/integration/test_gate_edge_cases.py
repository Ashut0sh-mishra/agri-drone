"""Test the gate decision logic with synthetic edge-case images."""
import numpy as np
import cv2


def test_gate(image_bgr, label):
    img_h, img_w = image_bgr.shape[:2]
    total_pixels = img_h * img_w

    # Face detection
    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    cascade = cv2.CascadeClassifier(cascade_path)
    gray_face = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(gray_face, 1.3, 5, minSize=(30, 30))
    face_count = len(faces)
    face_area = sum(w * h for (x, y, w, h) in faces) if len(faces) > 0 else 0
    face_area_pct = face_area / total_pixels

    # Skin
    ycrcb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2YCrCb)
    cr, cb = ycrcb[:, :, 1], ycrcb[:, :, 2]
    skin_mask = (cr >= 133) & (cr <= 173) & (cb >= 77) & (cb <= 127)
    skin_ratio = float(np.count_nonzero(skin_mask) / total_pixels)

    # Green
    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
    h, s, v = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    green_mask = (h >= 30) & (h <= 90) & (s > 25) & (v > 30)
    green_ratio = float(np.count_nonzero(green_mask) / total_pixels)
    green_pixel_count = np.count_nonzero(green_mask)

    # Brown
    brown_veg = (h >= 10) & (h <= 28) & (s > 60) & (v > 40) & (v < 200)
    brown_ratio = float(np.count_nonzero(brown_veg) / total_pixels)
    vegetation_ratio = green_ratio + brown_ratio

    # Green blob
    largest_green_blob_ratio = 0.0
    green_coherence = 0.0
    if green_pixel_count > 100:
        green_u8 = green_mask.astype(np.uint8) * 255
        n_labels, _, stats, _ = cv2.connectedComponentsWithStats(green_u8, 8)
        if n_labels > 1:
            largest_blob = int(stats[1:, cv2.CC_STAT_AREA].max())
            largest_green_blob_ratio = largest_blob / total_pixels
            green_coherence = largest_blob / green_pixel_count

    has_plant_region = largest_green_blob_ratio > 0.02

    # Achromatic
    achromatic_mask = s < 25
    achromatic_ratio = float(np.count_nonzero(achromatic_mask) / total_pixels)

    # Decision (mirrors the new logic in app.py)
    is_plant = False
    rule = "D6-default"

    if has_plant_region:
        is_plant = True
        rule = "D1-green-blob"
    elif face_count > 0 and face_area_pct > 0.01:
        rule = "D2-face"
    elif skin_ratio > 0.25:
        rule = "D3-skin"
    elif achromatic_ratio > 0.50:
        rule = "D4-achromatic"
    elif vegetation_ratio > 0.03:
        rule = "D5-scattered-green"

    status = "PASS" if is_plant else "REJECT"
    print(
        f"  [{status:6s}] {label:40s} | rule={rule:20s} "
        f"| blob={largest_green_blob_ratio:.3f} achro={achromatic_ratio:.2f} "
        f"green={green_ratio:.3f} skin={skin_ratio:.2f} faces={face_count}"
    )
    return is_plant


if __name__ == "__main__":
    print("=== EDGE CASE TESTS ===\n")

    # Test 1: Pure leaf close-up (SHOULD PASS)
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.ellipse(img, (320, 240), (280, 200), 0, 0, 360, (30, 130, 45), -1)
    for i in range(-5, 6):
        cv2.line(img, (120, 240 + i * 30), (520, 240 + i * 20), (25, 110, 35), 1)
    cv2.circle(img, (250, 200), 25, (20, 70, 130), -1)
    r1 = test_gate(img, "Close-up leaf (expect PASS)")

    # Test 2: Farmer holding leaf (SHOULD PASS)
    img2 = np.zeros((480, 640, 3), dtype=np.uint8)
    img2[:] = [140, 160, 180]
    cv2.ellipse(img2, (320, 200), (200, 150), 0, 0, 360, (30, 130, 45), -1)
    cv2.rectangle(img2, (220, 350), (420, 480), (110, 145, 205), -1)
    r2 = test_gate(img2, "Farmer holding leaf (expect PASS)")

    # Test 3: Indoor people NO plant (SHOULD REJECT)
    img3 = np.zeros((480, 640, 3), dtype=np.uint8)
    img3[:] = [180, 180, 185]
    cv2.rectangle(img3, (50, 100), (200, 400), (90, 120, 170), -1)
    cv2.rectangle(img3, (300, 80), (450, 400), (85, 115, 165), -1)
    cv2.rectangle(img3, (230, 420), (400, 480), (160, 160, 165), -1)
    r3 = test_gate(img3, "Indoor people no plant (expect REJECT)")

    # Test 4: White paper (SHOULD REJECT)
    img4 = np.zeros((480, 640, 3), dtype=np.uint8)
    img4[:] = [245, 245, 248]
    cv2.rectangle(img4, (50, 50), (590, 430), [235, 235, 240], -1)
    r4 = test_gate(img4, "White paper (expect REJECT)")

    # Test 5: Pen on desk (SHOULD REJECT)
    img5 = np.zeros((480, 640, 3), dtype=np.uint8)
    img5[:] = [200, 190, 185]
    cv2.rectangle(img5, (100, 220), (540, 260), [40, 40, 40], -1)
    r5 = test_gate(img5, "Pen on desk (expect REJECT)")

    # Test 6: Person holding plant (SHOULD PASS)
    img6 = np.zeros((480, 640, 3), dtype=np.uint8)
    img6[:] = [180, 175, 170]
    cv2.rectangle(img6, (200, 50), (440, 420), (90, 120, 170), -1)
    cv2.ellipse(img6, (320, 80), (60, 50), 0, 0, 360, (120, 160, 210), -1)
    cv2.ellipse(img6, (400, 250), (120, 100), 30, 0, 360, (25, 120, 40), -1)
    r6 = test_gate(img6, "Person holding plant (expect PASS)")

    # Test 7: Brown+green dried leaf (SHOULD PASS)
    img7 = np.zeros((480, 640, 3), dtype=np.uint8)
    img7[:] = [210, 200, 190]
    cv2.ellipse(img7, (320, 240), (220, 160), 0, 0, 360, (20, 80, 140), -1)
    cv2.ellipse(img7, (320, 240), (200, 140), 0, 0, 60, (30, 120, 50), -1)
    r7 = test_gate(img7, "Brown+green dried leaf (expect PASS)")

    # Test 8: Small plant far away (borderline - too small for blob)
    img8 = np.zeros((480, 640, 3), dtype=np.uint8)
    img8[:] = [200, 200, 205]
    cv2.circle(img8, (320, 240), 40, (25, 110, 35), -1)
    r8 = test_gate(img8, "Small plant far away (borderline)")

    # Test 9: Green wall/curtain (borderline PASS - can't distinguish)
    img9 = np.zeros((480, 640, 3), dtype=np.uint8)
    img9[:] = [35, 120, 50]
    r9 = test_gate(img9, "Green wall/curtain (borderline PASS)")

    print()
    results = [
        ("Close-up leaf", r1, True),
        ("Farmer holding leaf", r2, True),
        ("Indoor people no plant", r3, False),
        ("White paper", r4, False),
        ("Pen on desk", r5, False),
        ("Person holding plant", r6, True),
        ("Brown+green dried leaf", r7, True),
        ("Small plant far away", r8, False),
        ("Green wall/curtain", r9, True),
    ]
    correct = sum(1 for _, got, exp in results if got == exp)
    print(f"Score: {correct}/{len(results)} correct")
    for name, got, exp in results:
        tag = "OK" if got == exp else "FAIL"
        got_s = "PASS" if got else "REJECT"
        exp_s = "PASS" if exp else "REJECT"
        print(f"  [{tag}] {name}: got={got_s}, expected={exp_s}")
