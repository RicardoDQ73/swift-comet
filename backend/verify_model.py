from app import create_app
from models import EventSong

app = create_app()

with app.app_context():
    print(f"Checking EventSong model attributes...")
    if hasattr(EventSong, 'order'):
        print("SUCCESS: EventSong has 'order' attribute.")
        print(f"Column definition: {EventSong.order}")
    else:
        print("FAILURE: EventSong DOES NOT have 'order' attribute.")
