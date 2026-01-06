import sys
import os
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__)))

from app import create_app
from services.ai_service import _generate_minimax

load_dotenv()

app = create_app()

with app.app_context():
        # Testing specific payload directly
        import base64
        import requests
        import os
        
        token = os.getenv("REPLICATE_API_TOKEN")
        
        with open("dummy_voice.wav", "rb") as f:
            encoded = base64.b64encode(f.read()).decode('utf-8')
            data_uri = f"data:audio/wav;base64,{encoded}"
            
        print("Sending request with voice_file AND song_file...")
        
        resp = requests.post(
            "https://api.replicate.com/v1/models/minimax/music-01/predictions",
            headers={"Authorization": f"Token {token}", "Content-Type": "application/json"},
            json={
                "input": {
                    "prompt": "Test song",
                    "lyrics": "Test lyrics",
                    "voice_file": data_uri,
                    "song_file": data_uri, # Using same file as reference style
                    "model_name": "music-01"
                }
            }
        )
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
