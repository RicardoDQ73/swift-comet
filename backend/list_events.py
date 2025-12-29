from app import create_app
from models import Event

app = create_app()

with app.app_context():
    events = Event.query.all()
    print(f"Total events found: {len(events)}")
    for e in events:
        print(f"ID: {e.id} | Title: {e.title} | Active: {e.is_active}")
