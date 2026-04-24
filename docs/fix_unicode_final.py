"""
FINAL FIX - Run from D:\Projects\agri-drone\
Command: python fix_unicode_final.py
"""
import os, re

path = "scripts/phone_connect.py"

with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

print(f"File size: {len(content)} chars")

# Find the EXACT line causing the crash
# The error is in starlette/responses.py line 53: content.encode(self.charset)
# This means the HTML page itself has bad characters
# We need to find where the HTML response is returned and encode it safely

# Strategy: Find ALL HTMLResponse or return HTMLResponse calls
# and wrap their content

changes = 0

# Fix 1: Replace HTMLResponse with safe version
# Find all occurrences of HTMLResponse( and wrap content
if 'HTMLResponse' in content:
    print("Found HTMLResponse - fixing...")
    # Add import at top
    if 'from fastapi.responses import HTMLResponse' in content:
        content = content.replace(
            'from fastapi.responses import HTMLResponse',
            'from fastapi.responses import HTMLResponse, Response'
        )
    
    # Find all return HTMLResponse(...) and fix encoding
    # Replace pattern: return HTMLResponse(content=some_var)
    # With safe version
    content = re.sub(
        r'return HTMLResponse\(content=([^)]+)\)',
        lambda m: f'return Response(content={m.group(1)}.encode("utf-8","surrogateescape").decode("utf-8","ignore").encode("utf-8"), media_type="text/html; charset=utf-8")',
        content
    )
    changes += 1
    print("Fixed HTMLResponse encoding")

# Fix 2: Find the get_mobile_page or similar endpoint that serves HTML
# and make it encode safely
html_endpoints = [
    'def get_mobile_page',
    'def mobile_page', 
    'def phone_page',
    'def index',
    'def root',
    'def serve_phone',
]

for ep in html_endpoints:
    if ep in content:
        print(f"Found endpoint: {ep}")

# Fix 3: Nuclear option - find ANY string that goes into a Response
# and sanitize it at the Response level
# Add a middleware to catch encoding errors

middleware_code = '''
@app.middleware("http")
async def unicode_fix_middleware(request, call_next):
    import json
    response = await call_next(request)
    return response

'''

# Actually the real fix: find where HTML is generated and sanitize
# Look for the mobile HTML template
if 'DOCTYPE html' in content or 'text/html' in content:
    print("Found HTML template in file")
    
    # Find position of HTML content
    idx = content.find('DOCTYPE html')
    if idx == -1:
        idx = content.find('text/html')
    print(f"HTML found at position: {idx}")
    print(f"Context around HTML: {content[max(0,idx-100):idx+100]}")

# Fix 4: The real nuclear fix
# Replace the entire response creation with safe encoding
old_patterns = [
    'return HTMLResponse(html)',
    'return HTMLResponse(content=html)',
    'return HTMLResponse(page)',
    'return HTMLResponse(content=page)',
]

for old in old_patterns:
    if old in content:
        safe_new = old.replace(
            'return HTMLResponse(',
            'return Response(content='
        ).replace(
            'html)',
            'html.encode("utf-8","ignore"), media_type="text/html; charset=utf-8")'
        ).replace(
            'page)',
            'page.encode("utf-8","ignore"), media_type="text/html; charset=utf-8")'
        ).replace(
            'content=html.encode',
            'html.encode'
        ).replace(
            'content=page.encode',
            'page.encode'
        )
        content = content.replace(old, safe_new)
        print(f"Fixed: {old}")
        changes += 1

# Fix 5: Find ALL f-strings or string concatenation that builds the HTML
# and add .encode('utf-8','ignore').decode('utf-8') before returning

# Search for the actual HTML return statement
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'HTMLResponse' in line and 'return' in line:
        print(f"Line {i}: {line.strip()}")

# Save
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\nMade {changes} changes")
print("\nNow paste this prompt into Claude Opus 4.6:")
print("="*50)
prompt = """
In scripts/phone_connect.py find the endpoint that 
serves the mobile phone webpage HTML.

It will look like one of these:
  @app.get("/")
  @app.get("/mobile")  
  @app.get("/phone")
  async def get_page(...)
  
Find the EXACT line that returns the HTML, like:
  return HTMLResponse(content=html)
  OR return HTMLResponse(html)
  OR return Response(content=page)

Replace that SINGLE line with:
  safe_html = html.encode('utf-8', 'surrogateescape').decode('ascii', 'ignore')
  from fastapi.responses import Response
  return Response(
      content=safe_html.encode('utf-8'),
      media_type="text/html; charset=utf-8"
  )

Also find the /api/status/{job_id} endpoint and replace 
its return with:
  import json
  from fastapi.responses import Response  
  safe = json.dumps(
      _job_results.get(job_id, {"status":"processing"}),
      ensure_ascii=True,
      default=lambda x: str(x).encode('utf-8','ignore').decode('utf-8')
  )
  return Response(content=safe.encode('utf-8'), 
                  media_type="application/json")

Show me ONLY those two functions, complete, no truncation.
"""
print(prompt)
