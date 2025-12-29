from app import create_app
from models import Song, User

app = create_app()

def debug_songs():
    with app.app_context():
        print("--- SONG DEBUG REPORT ---")
        users = User.query.all()
        for u in users:
            print(f"\nUser: {u.name} (ID: {u.id}, Role: {u.role})")
            songs = Song.query.filter_by(user_id=u.id).all()
            if not songs:
                print("  No songs found.")
            for s in songs:
                print(f"  - Song ID: {s.id}")
                print(f"    Title: {s.title}")
                print(f"    Type: {s.song_type}")
                print(f"    Archived: {s.is_archived}")
                print(f"    Created: {s.created_at}")
                print("    ---")

if __name__ == "__main__":
    debug_songs()
