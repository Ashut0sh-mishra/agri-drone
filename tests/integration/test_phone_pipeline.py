"""Quick test: phone connect → /detect API → mobile format result."""
import requests, os, glob, time

# Find a sample image
patterns = ['data/sample/*.jpg', 'data/sample/*.png', 'data/raw/**/*.jpg', 'data/wheat_raw/**/*.jpg']
img = None
for p in patterns:
    found = glob.glob(p, recursive=True)
    if found:
        img = found[0]
        break

if not img:
    print('No test image found')
    exit(1)

print(f'Using: {img}')

# Upload to phone connect API
with open(img, 'rb') as f:
    r = requests.post('http://127.0.0.1:8765/api/upload',
                       files={'photo': (os.path.basename(img), f, 'image/jpeg')})

print(f'Status: {r.status_code}')
data = r.json()
job_id = data.get('job_id', 'N/A')
upload_id = data.get('upload_id', 'N/A')
print(f'Job ID: {job_id}  Upload ID: {upload_id}')

# Poll /api/status/{job_id} (what the mobile JS actually uses)
if job_id and job_id != 'N/A':
    for i in range(20):
        time.sleep(1)
        r2 = requests.get(f'http://127.0.0.1:8765/api/status/{job_id}')
        result = r2.json()
        if result.get('status') == 'complete':
            print(f'\n=== RESULT via /api/status ({i+1}s) ===')
            for k, v in result.items():
                print(f'  {k}: {v}')
            break
        else:
            print(f'  Waiting... ({i+1}s) status={result.get("status")}')
    else:
        print('Timed out waiting for result')

# Also check /api/result/{upload_id}
if upload_id and upload_id != 'N/A':
    r3 = requests.get(f'http://127.0.0.1:8765/api/result/{upload_id}')
    result = r3.json()
    print(f'\n=== RESULT via /api/result ===')
    for k, v in result.items():
        if k != 'yolo_detections':
            print(f'  {k}: {v}')
    print(f'  yolo_detections: {len(result.get("yolo_detections", []))} items')
