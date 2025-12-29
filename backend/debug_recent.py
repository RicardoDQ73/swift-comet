from app import create_app
from models import Song, User
from sqlalchemy import desc

app = create_app()

def debug_recent():
    with app.app_context():
        print("--- RECENT SONGS DEBUG ---")
        # Get last 10 songs
        songs = Song.query.order_by(desc(Song.created_at)).limit(10).all()
        for s in songs:
             print(f"ID: {s.id} | Title: {s.title} | User: {s.author.name if s.author else 'Unknown'} (ID: {s.user_id}) | Type: {s.song_type} | Archived: {s.is_archived}")
             
        print("\n--- ALL USERS ---")
        users = User.query.all()
        for u in users:
            print(f"ID: {u.id} | Name: {u.name} | Role: {u.role}")

if __name__ == "__main__":
    debug_recent()
