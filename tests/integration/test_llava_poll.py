"""Test: verify LLaVA background + polling works with the race condition fix."""
import requests, json, time

img = "data/raw/rice/Rice_Leaf_AUG/Bacterial Leaf Blight/20231006_164208.jpg"
with open(img, "rb") as f:
    r = requests.post(
        "http://127.0.0.1:9000/detect",
        files={"file": ("test.jpg", f, "image/jpeg")},
        data={"crop_type": "wheat", "use_llava": "false", "include_image": "false"},
    )

d = r.json()
print(f"llava_pending: {d.get('llava_pending')}")
print(f"llava_hash: {str(d.get('llava_hash', ''))[:12]}...")
print(f"llava_analysis present: {d.get('llava_analysis') is not None}")

s = d.get("structured", {})
print(f"ai_validation in structured: {'ai_validation' in s}")

# Now poll for LLaVA result
h = d.get("llava_hash")
if h and d.get("llava_pending"):
    print("\nPolling for LLaVA result...")
    for i in range(40):
        time.sleep(3)
        r2 = requests.get(f"http://127.0.0.1:9000/detect/llava-status/{h}")
        status = r2.json()
        if status["status"] == "complete":
            print("LLaVA complete!")
            la = status.get("llava_analysis")
            lv = status.get("llm_validation")
            if la:
                print(f"  health_score: {la.get('health_score')}")
                print(f"  diseases: {la.get('diseases_found')}")
            if lv:
                print(f"  agrees: {lv.get('agrees')}")
                print(f"  llm_diagnosis: {lv.get('llm_diagnosis')}")
                print(f"  agreement_score: {lv.get('agreement_score')}")
                print(f"  scenario: {lv.get('scenario')}")
                print(f"  reasoning_text: {str(lv.get('reasoning_text', ''))[:100]}...")
            else:
                print("  llm_validation: None (no validation context)")
            break
        elif status["status"] == "pending":
            print(f"  attempt {i+1}: pending...")
        else:
            print(f"  status: {status['status']}")
            break
    else:
        print("Timed out waiting for LLaVA")
else:
    if not d.get("llava_pending"):
        print("\nERROR: llava_pending is still False! Race condition not fixed.")
    else:
        print("\nNo llava_hash returned")
