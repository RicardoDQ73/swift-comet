import requests, json, sys, time

BASE_URL = 'http://127.0.0.1:5000'

# Test user credentials
email = 'testuser@example.com'
password = 'TestPass123!'
name = 'Test User'

# Register (ignore if already exists)
try:
    reg_resp = requests.post(f'{BASE_URL}/api/auth/register', json={
        'name': name,
        'email': email,
        'password': password
    })
    if reg_resp.status_code == 201:
        print('User registered')
    elif reg_resp.status_code == 409:
        print('User already exists')
    else:
        print('Register response:', reg_resp.status_code, reg_resp.text)
except Exception as e:
    print('Register error:', e)
    sys.exit(1)

# Login to obtain JWT token
login_resp = requests.post(f'{BASE_URL}/api/auth/login', json={
    'email': email,
    'password': password
})
if login_resp.status_code != 200:
    print('Login failed:', login_resp.status_code, login_resp.text)
    sys.exit(1)

token = login_resp.json().get('token')
print('Obtained token')

# Generate music
headers = {'Authorization': f'Bearer {token}'}
payload = {'prompt': 'una melodía alegre con piano', 'duration': 10}
gen_resp = requests.post(f'{BASE_URL}/api/music/generate', json=payload, headers=headers, timeout=180)
print('Generate status:', gen_resp.status_code)
try:
    print('Response:', gen_resp.json())
except Exception:
    print('Raw response:', gen_resp.text)
