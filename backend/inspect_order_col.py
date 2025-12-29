from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("Inspecting 'event_songs' table...")
    try:
        with db.engine.connect() as conn:
            # Postgres specific query for columns
            result = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='event_songs'"))
            columns = result.fetchall()
            print("Columns found:")
            found_order = False
            for col in columns:
                print(f"- {col[0]} ({col[1]})")
                if col[0] == 'order':
                    found_order = True
            
            if found_order:
                print("\nSUCCESS: 'order' column exists.")
            else:
                print("\nFAILURE: 'order' column MISSING.")
                
            # Check for nulls
            res_nulls = conn.execute(text("SELECT count(*) FROM event_songs WHERE \"order\" IS NULL"))
            null_count = res_nulls.fetchone()[0]
            print(f"Rows with NULL order: {null_count}")

    except Exception as e:
        print(f"Error inspecting DB: {e}")
