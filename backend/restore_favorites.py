from app import create_app, db
from models import Favorite, Song

app = create_app()

def restore_favorites():
    with app.app_context():
        # Specifically for user 4 ("Miss karen Cabana")
        user_id = 4
        print(f"Restaurando favoritos para usuario {user_id}...")
        
        # Get all songs for this user
        songs = Song.query.filter_by(user_id=user_id).all()
        
        count = 0
        for s in songs:
            # Check if fav exists
            exists = Favorite.query.filter_by(user_id=user_id, song_id=s.id).first()
            if not exists:
                new_fav = Favorite(user_id=user_id, song_id=s.id)
                db.session.add(new_fav)
                count += 1
        
        db.session.commit()
        print(f"Restaurados {count} favoritos.")

if __name__ == "__main__":
    restore_favorites()
