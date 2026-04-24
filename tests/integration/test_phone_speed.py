"""Test phone connect fast pipeline speed."""
import requests, time, json

img = "data/raw/rice/Rice_Leaf_AUG/Bacterial Leaf Blight/20231006_164208.jpg"
start = time.perf_counter()

with open(img, "rb") as f:
    r = requests.post("http://127.0.0.1:8765/api/upload", files={"photo": ("test.jpg", f, "image/jpeg")})
d = r.json()
print(f"Upload response: {d['status']} (job={d.get('job_id','')})")
job_id = d.get("job_id")

for i in range(30):
    time.sleep(1)
    r2 = requests.get(f"http://127.0.0.1:8765/api/status/{job_id}")
    s = r2.json()
    if s.get("status") == "complete":
        elapsed = time.perf_counter() - start
        print(f"\nCOMPLETE in {elapsed:.1f}s!")
        print(f"  Disease: {s.get('disease')}")
        print(f"  Health: {s.get('health')}/100")
        print(f"  Risk: {s.get('risk')}")
        print(f"  Confidence: {s.get('confidence')}")
        print(f"  Symptoms: {str(s.get('symptoms',''))[:120]}")
        print(f"  Treatment: {str(s.get('treatment',''))[:120]}")
        break
    elif s.get("status") == "analyzing":
        print(f"  Poll {i+1}: still analyzing...")
    else:
        print(f"  Poll {i+1}: {s.get('status')}")
else:
    print("Timed out!")
