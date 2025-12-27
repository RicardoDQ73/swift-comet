from app import create_app
from models import db, Song, Favorite, User

app = create_app()

with app.app_context():
    print("--- DIAGNOSTIC START ---")
    
    # Check total counts
    song_count = Song.query.count()
    fav_count = Favorite.query.count()
    print(f"Total Songs: {song_count}")
    print(f"Total Favorites: {fav_count}")
    
    print("\n--- ALL FAVORITES ---")
    favs = Favorite.query.all()
    for f in favs:
        print(f"Fav ID: {f.id} | User ID: {f.user_id} | Song ID: {f.song_id}")
        
    print("\n--- CHECKING MONITOR LOGIC (Last 10 Songs) ---")
    songs = Song.query.order_by(Song.created_at.desc()).limit(10).all()
    for s in songs:
        is_fav = Favorite.query.filter_by(song_id=s.id).first() is not None
        fav_entry = Favorite.query.filter_by(song_id=s.id).first()
        print(f"Song ID: {s.id} | Title: {s.title} | Is Favorite? {is_fav} | Entry: {fav_entry}")

    print("--- DIAGNOSTIC END ---")
