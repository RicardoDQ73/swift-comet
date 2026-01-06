from app import create_app
from models import Song

app = create_app()
with app.app_context():
    songs = Song.query.order_by(Song.id.desc()).limit(5).all()
    for s in songs:
        print(f"ID: {s.id}, Title: {s.title}, Created: {s.created_at}")
