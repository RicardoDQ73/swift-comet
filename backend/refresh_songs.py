from app import create_app, db
from models import Song
from datetime import datetime

app = create_app()

def refresh_songs():
    with app.app_context():
        print("Restaurando visibilidad de canciones...")
        # Update all active songs to look like they were created just now
        # This brings them back into the 24h window
        songs = Song.query.filter_by(is_archived=False).all()
        for s in songs:
            print(f"Refrescando: {s.title} (User {s.user_id})")
            s.created_at = datetime.utcnow()
        
        db.session.commit()
        print("Todas las canciones han sido refrescadas y deberían ser visibles.")

if __name__ == "__main__":
    refresh_songs()
