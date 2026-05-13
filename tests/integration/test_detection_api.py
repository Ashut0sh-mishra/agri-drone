#!/usr/bin/env python
"""
Test script to verify the updated detection API with crop_type and use_llava parameters.
"""

import requests
import json
from pathlib import Path

# Configuration
API_BASE = "http://localhost:9000"
DETECT_ENDPOINT = f"{API_BASE}/detect"

# Test parameters — auto-find first image in data/sample/
_sample_dir = Path("data/sample")
_candidates = list(_sample_dir.glob("*.*")) if _sample_dir.exists() else []
TEST_IMAGE = str(_candidates[0]) if _candidates else "data/sample/test.jpg"
CROP_TYPE = "rice"
USE_LLAVA = False  # Set to True if Ollama + LLaVA is running
CONFIDENCE = 0.25

def test_detection_api():
    """Test the detection API with new parameters."""
    print("🧪 Testing Detection API")
    print("=" * 60)
    
    # Check if test image exists
    test_img_path = Path(TEST_IMAGE)
    if not test_img_path.exists():
        print(f"❌ Test image not found: {TEST_IMAGE}")
        print(f"   Available sample images:")
        sample_dir = Path("data/sample")
        if sample_dir.exists():
            for img in sample_dir.glob("*.*"):
                print(f"   - {img.name}")
        return False
    
    # Prepare form data
    with open(test_img_path, "rb") as f:
        files = {"file": f}
        data = {
            "confidence_threshold": CONFIDENCE,
            "include_image": True,
            "crop_type": CROP_TYPE,
            "use_llava": USE_LLAVA,
        }
        
        print(f"\n📤 Sending request:")
        print(f"   Endpoint: POST {DETECT_ENDPOINT}")
        print(f"   Image: {TEST_IMAGE}")
        print(f"   Crop Type: {CROP_TYPE}")
        print(f"   Use LLaVA: {USE_LLAVA}")
        print(f"   Confidence Threshold: {CONFIDENCE}")
        
        try:
            response = requests.post(DETECT_ENDPOINT, files=files, data=data, timeout=120)
            print(f"\n✅ API Response Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"\n📊 Detection Results:")
                print(f"   Status: {result.get('status')}")
                print(f"   Batch ID: {result.get('batch_id')}")
                print(f"   Detections: {result.get('num_detections')}")
                print(f"   Processing Time: {result.get('processing_time_ms'):.1f}ms")
                
                # Check for LLaVA analysis
                if result.get('llava_analysis'):
                    print(f"\n🤖 LLaVA Analysis:")
                    llava = result['llava_analysis']
                    print(f"   Health Score: {llava.get('health_score')}")
                    print(f"   Diseases: {llava.get('diseases_found')}")
                    print(f"   Symptoms: {llava.get('visible_symptoms')}")
                    print(f"   Recommendations: {llava.get('recommendations')}")
                else:
                    print(f"\n⚠️  No LLaVA analysis (use_llava=False or Ollama unavailable)")
                
                # Show detection details
                if result.get('detections'):
                    print(f"\n🎯 Detected Objects:")
                    for det in result['detections'][:5]:
                        print(f"   - {det['class_name']}: {det['confidence']:.2%} confidence")
                else:
                    print(f"\n✅ No issues detected (healthy crop)")
                
                return True
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False
                
        except requests.exceptions.ConnectionError:
            print(f"❌ Connection Error: API not reachable at {API_BASE}")
            print(f"   Make sure uvicorn is running: uvicorn src.agrianalyze.api.app:app --host 0.0.0.0 --port 8080")
            return False
        except Exception as e:
            print(f"❌ Error: {e}")
            return False

def test_health():
    """Test API health endpoint."""
    print("\n🏥 Testing API Health")
    print("=" * 60)
    
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        if response.status_code == 200:
            print(f"✅ API is healthy")
            print(f"   Response: {response.text[:100]}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to API at {API_BASE}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  AGRIANALYZE API TEST SUITE")
    print("=" * 60)
    
    # Test health first
    if not test_health():
        print("\n⚠️  API is not running. Start it with:")
        print("   cd d:\\Projects\\agri-analyze")
        print("   python -m uvicorn agrianalyze.api.app:app --host 127.0.0.1 --port 9000")
        exit(1)
    
    # Test detection API
    success = test_detection_api()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ All tests passed!")
    else:
        print("❌ Some tests failed. Check errors above.")
    print("=" * 60 + "\n")
