
from app import create_app, db
from sqlalchemy import text

app = create_app()

def migrate():
    with app.app_context():
        print("Iniciando migración: Añadir columna is_archived a tabla songs...")
        try:
            # Intentar añadir la columna. Si falla, probablemente ya existe.
            # SQLite no soporta IF NOT EXISTS en ADD COLUMN en versiones antiguas, pero PostgreSQL sí.
            # Haremos un try/catch genérico.
            with db.engine.connect() as conn:
                conn.execute(text("ALTER TABLE songs ADD COLUMN is_archived BOOLEAN DEFAULT FALSE"))
                conn.commit()
            print("Migración exitosa: Columna is_archived añadida.")
        except Exception as e:
            if "duplicate column" in str(e) or "no such table" in str(e):
                print(f"Nota: {e}")
            else:
                # En SQLite, si la columna existe, da error. Asumimos éxito si ya existe.
                print(f"Posible error o columna ya existente: {e}")

if __name__ == "__main__":
    migrate()
