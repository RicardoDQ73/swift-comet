from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# Importamos nuestra configuración y modelos
from config import Config
from models import db, Song, Favorite
from utils.logger import audit_logger

def create_app():
    """
    Fábrica de Aplicación Flask.
    Aquí nace el servidor.
    """
    app = Flask(__name__)
    app.config.from_object(Config)

    # Inicializar extensiones
    # 1. Base de Datos
    db.init_app(app)
    
    # 2. CORS (Permite que el Frontend React hable con este Backend)
    CORS(app)

    # 3. Scheduler (Para limpieza automática - RNF-12)
    scheduler = BackgroundScheduler()
    scheduler.add_job(func=cleanup_history, trigger="interval", hours=1, args=[app])
    scheduler.start()

    # Registrar Blueprints (Rutas)
    from routes.auth_routes import auth_bp, bcrypt
    # from routes.music_routes import music_bp
    # from routes.admin_routes import admin_bp
    
    # Inicializar Bcrypt con la app
    bcrypt.init_app(app)
    
    # Configurar JWT
    from flask_jwt_extended import JWTManager
    jwt = JWTManager(app)

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    from routes.music_routes import music_bp
    app.register_blueprint(music_bp, url_prefix='/api/music')
    
    from routes.admin_routes import admin_bp
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    from routes.tts_routes import tts_bp
    app.register_blueprint(tts_bp, url_prefix='/api/tts')

    # Crear tablas si no existen (Solo para prototipo)
    with app.app_context():
        db.create_all()
        audit_logger.info("Sistema iniciado. Base de datos verificada.")

    return app

def cleanup_history(app):
    """
    Tarea programada: Elimina canciones viejas (>24h) que NO son favoritas.
    RNF-12: Gestión del historial.
    """
    with app.app_context():
        audit_logger.info("Ejecutando limpieza automática de historial...")
        expiration_time = datetime.utcnow() - timedelta(hours=24)
        
        # Lógica SQL: Borrar canciones creadas antes de 24h Y que no estén en favoritos
        # Nota: SQLAlchemy lo hace más pythonico
        
        # 1. Buscar canciones expiradas
        expired_songs = Song.query.filter(Song.created_at < expiration_time).all()
        
        deleted_count = 0
        for song in expired_songs:
            # Verificar si es favorita
            is_fav = Favorite.query.filter_by(song_id=song.id).first()
            if not is_fav:
                db.session.delete(song)
                deleted_count += 1
                # Aquí también borraríamos el archivo físico MP3
        
        db.session.commit()
        if deleted_count > 0:
            audit_logger.info(f"Limpieza completada: {deleted_count} canciones eliminadas.")

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
