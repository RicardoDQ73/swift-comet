import requests, json, sys
url = 'http://127.0.0.1:5000/api/music/generate'
payload = {'prompt':'una melodía alegre con piano','duration':10}
try:
    r = requests.post(url, json=payload, timeout=120)
    print('Status:', r.status_code)
    print('Response:', r.json())
except Exception as e:
    print('Error:', e)
