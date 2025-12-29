from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("Migrating: Adding 'order' column to 'event_songs' table...")
    try:
        # Check if column exists
        with db.engine.connect() as conn:
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='event_songs' AND column_name='order'"))
            if result.fetchone():
                print("Column 'order' already exists.")
            else:
                # Add column
                conn.execute(text("ALTER TABLE event_songs ADD COLUMN \"order\" INTEGER DEFAULT 0"))
                conn.commit()
                print("Column 'order' added successfully.")
    except Exception as e:
        print(f"Error during migration: {e}")
