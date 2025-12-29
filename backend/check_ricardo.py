from app import create_app
from models import Song, User

app = create_app()

def check_ricardo():
    with app.app_context():
        user = User.query.filter_by(name="Ricardo Deza").first()
        if user:
            print(f"Checking songs for {user.name} (ID: {user.id})")
            songs = Song.query.filter_by(user_id=user.id).all()
            print(f"Found {len(songs)} songs.")
            for s in songs:
                print(f" - {s.title}")
        else:
            print("User Ricardo not found.")

if __name__ == "__main__":
    check_ricardo()
