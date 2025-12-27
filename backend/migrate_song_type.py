from app import create_app, db
from models import Song
from sqlalchemy import text

app = create_app()

def migrate():
    with app.app_context():
        print("Iniciando migración de base de datos...")
        
        # 1. Añadir columna song_type
        try:
            # Intentamos comando compatible con Postgres/SQLite moderno
            with db.engine.connect() as conn:
                conn.execute(text("ALTER TABLE songs ADD COLUMN song_type VARCHAR(20) DEFAULT 'GENERATED';"))
                conn.commit()
            print("Columna 'song_type' añadida exitosamente.")
        except Exception as e:
            print(f"Nota: {e}")
            print("Es posible que la columna ya exista. Continuando...")

        # 2. Actualizar registros existentes
        # Si tiene el tag "Karaoke Mix", es un COVER. Si no, es GENERATED (por defecto, pero forzamos por si acaso)
        print("Actualizando registros existentes...")
        songs = Song.query.all()
        updated_count = 0
        
        for song in songs:
            # Verificamos tags. En el modelo es JSON, pero a veces viene como dict, a veces string?
            # SqlAlchemy con dialecto postgresql.JSON devuelve dict.
            is_karaoke = False
            if song.tags:
                if isinstance(song.tags, dict):
                    if song.tags.get('mode') == 'Karaoke Mix':
                        is_karaoke = True
                # Si fuera lista o string parsearíamos, pero asumimos dict por el modelo
            
            if is_karaoke:
                song.song_type = 'COVER'
                updated_count += 1
            else:
                # Asegurar que los demás sean GENERATED (ya lo hace el default, pero para consistencia)
                if not song.song_type:
                    song.song_type = 'GENERATED'

        db.session.commit()
        print(f"Migración completada. {updated_count} canciones marcadas como COVER.")

if __name__ == "__main__":
    migrate()
