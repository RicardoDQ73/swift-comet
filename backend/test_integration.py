import requests
import json

def test_generate():
    url = "http://127.0.0.1:5000/api/music/generate"
    # Need to simulate multipart/form-data with fields
    # But wait, ai_service accepts params. Routes handle the request.
    # The route expects 'prompt', 'lyrics', 'model_type'.
    
    # We need to login first to get a token? 
    # The route is @jwt_required()? Let's check routes/music_routes.py
    # Yes likely.
    
    # Step 1: Login
    login_url = "http://127.0.0.1:5000/api/auth/login"
    login_payload = {"email": "admin@swiftcomet.com", "password": "AdminSecretPassword123!"}
    
    print("Logging in...")
    sess = requests.Session()
    resp = sess.post(login_url, json=login_payload)
    if resp.status_code != 200:
        print("Login failed", resp.text)
        return
        
    print("Login Response:", resp.json())
    token = resp.json().get('access_token') or resp.json().get('token')
    headers = {"Authorization": f"Bearer {token}"}
    
    # Step 2: Generate
    print("Requesting generation...")
    # We won't upload a file, we rely on the system voice being present.
    # We just send text fields.
    data = {
        "prompt": "Integration Test Song",
        "lyrics": "Testing the system, one two three.",
        "model_type": "vocal"
    }
    
    try:
        r = sess.post(url, headers=headers, json=data, timeout=300)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_generate()
