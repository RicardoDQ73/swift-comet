from app import create_app
from models import Event, EventSong

app = create_app()

with app.app_context():
    # Find likely event
    events = Event.query.filter(Event.title.ilike('%padre%')).all()
    
    if not events:
        print("No event found with 'padre' in title.")
    else:
        for e in events:
            print(f"Event ID: {e.id}, Title: {e.title}")
            songs = EventSong.query.filter_by(event_id=e.id).all()
            print(f"  Song Count: {len(songs)}")
            for es in songs:
                print(f"    - Song ID: {es.song_id}, Order: {es.order}, Added By: {es.added_by}")
