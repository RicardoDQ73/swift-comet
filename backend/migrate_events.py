from app import create_app, db
from models import Event, EventSong

app = create_app()

with app.app_context():
    print("Creating new tables for Events module...")
    # SQL Alchemy safe create: only creates missing tables
    db.create_all()
    print("Tables 'events' and 'event_songs' created successfully (if they didn't exist).")
