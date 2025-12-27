from app import create_app
from models import db, Song, Favorite

app = create_app()

with app.app_context():
    print("--- TEST: CREATE SONG ---")
    
    # Create dummy song
    new_song = Song(
        title="Test Song For Favorites",
        prompt="Testing...",
        audio_filename="test_audio.mp3",
        user_id=4, # Assuming user 4 exists from previous log
        duration=10
    )
    db.session.add(new_song)
    db.session.commit()
    
    print(f"Created Song ID: {new_song.id}")
    
    # Check if it has a favorite entry
    fav_entry = Favorite.query.filter_by(song_id=new_song.id).first()
    is_fav = fav_entry is not None
    
    print(f"Is New Song Favorite? {is_fav}")
    
    if is_fav:
        print("ERROR: New song was automatically favorited!")
        print(f"Favorite Entry: {fav_entry}")
    else:
        print("SUCCESS: New song is NOT favorite by default.")
        
    print("--- CLEANUP ---")
    db.session.delete(new_song)
    db.session.commit()
    print("Test Song deleted.")
