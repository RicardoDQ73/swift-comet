from app import create_app
from models import Favorite, User, Song

app = create_app()

def inspect_favorites():
    with app.app_context():
        print("--- FAVORITES INSPECTION ---")
        users = User.query.all()
        for u in users:
            print(f"User: {u.name} (ID: {u.id})")
            favs = Favorite.query.filter_by(user_id=u.id).all()
            if not favs:
                print("  No favorites found.")
            else:
                for f in favs:
                    print(f"  - Fav ID: {f.id} -> Song ID: {f.song_id}")

if __name__ == "__main__":
    inspect_favorites()
