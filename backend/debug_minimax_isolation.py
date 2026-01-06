import os
import httpx
import time
import json

# Manually set or load env var for this test script
def load_env():
    try:
        with open('.env', 'r') as f:
            for line in f:
                if '=' in line:
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
    except FileNotFoundError:
        print(".env file not found")

load_env()
REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")

def test_minimax():
    if not REPLICATE_API_TOKEN:
        print("ERROR: REPLICATE_API_TOKEN not found.")
        return

    print("Testing Minimax Music-01 generation to isolation...")

    headers = {
        "Authorization": f"Token {REPLICATE_API_TOKEN}",
        "Content-Type": "application/json"
    }

    # 1. Get Latest Version Dynamically
    try:
        print("Fetching latest version for minimax/music-01...")
        v_res = httpx.get("https://api.replicate.com/v1/models/minimax/music-01", headers=headers)
        if v_res.status_code == 200:
            version_data = v_res.json()
            MODEL_VERSION = version_data['latest_version']['id']
            print(f"Found latest version: {MODEL_VERSION}")
        else:
            print(f"Failed to get version: {v_res.status_code} - {v_res.text}")
            # Fallback to known working hash if fetch fails (or maybe the model is private?)
            # Trying another hash from search if logical, else fail.
            return
    except Exception as e:
         print(f"Error fetching version: {e}")
         return

    payload = {
        "version": MODEL_VERSION,
        "input": {
            "prompt": "Test song, upbeat pop",
            "lyrics": "This is a test lyrics\nTesting the API",
            "model_name": "music-01"
        }
    }

    print("Sending payload:", json.dumps(payload, indent=2))

    try:
        with httpx.Client(timeout=30) as client:
            response = client.post(
                "https://api.replicate.com/v1/predictions",
                headers=headers,
                json=payload
            )
            
            print(f"Status Code: {response.status_code}")
            if response.status_code != 201:
                print("Error Response Text:", response.text)
                return

            prediction = response.json()
            prediction_id = prediction["id"]
            print(f"Prediction ID: {prediction_id}")
            print(f"Monitor URL: https://replicate.com/p/{prediction_id}")
            
            # Allow short poll to see if it immediately fails
            for _ in range(5):
                time.sleep(2)
                status_res = client.get(
                    f"https://api.replicate.com/v1/predictions/{prediction_id}",
                    headers=headers
                )
                status_data = status_res.json()
                print(f"Status: {status_data['status']}")
                if status_data['status'] == 'failed':
                    print("Failure Error:", status_data.get('error'))
                    break
                if status_data['status'] == 'succeeded':
                    print("Success! URL:", status_data.get('output'))
                    break

    except Exception as e:
        print(f"Exception happened: {e}")

if __name__ == "__main__":
    test_minimax()
