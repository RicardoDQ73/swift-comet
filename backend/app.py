from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# Importamos nuestra configuración y modelos
from config import Config
from models import db, Song, Favorite, EventSong
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
    # 2. CORS (Permite que el Frontend React hable con este Backend)
    # Configuración permisiva para desarrollo móvil
    CORS(app, resources={r"/*": {"origins": "*"}}, allow_headers=["Content-Type", "Authorization"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

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

    from routes.event_routes import event_bp
    app.register_blueprint(event_bp, url_prefix='/api/events')

    # Crear tablas si no existen (Solo para prototipo)
    with app.app_context():
        db.create_all()
        audit_logger.info("Sistema iniciado. Base de datos verificada.")

    return app

def cleanup_history(app):
    """
    Tarea programada: Archiva (Soft Delete) canciones viejas (>24h) que NO son favoritas.
    RNF-12: Gestión del historial.
    """
    with app.app_context():
        # audit_logger.info("Verificando canciones para archivar...") 
        expiration_time = datetime.utcnow() - timedelta(hours=24)
        
        # 1. Buscar canciones expiradas que NO estén ya archivadas
        expired_songs = Song.query.filter(Song.created_at < expiration_time, Song.is_archived == False).all()
        
        archived_count = 0
        for song in expired_songs:
            # Verificar si es favorita (Las favoritas NO se tocan)
            is_fav = Favorite.query.filter_by(song_id=song.id).first()
            
            # Verificar si está en algun evento (Los eventos NO se tocan)
            in_event = EventSong.query.filter_by(song_id=song.id).first()
            
            if not is_fav and not in_event:
                # SOFT DELETE: Solo marcamos como archivada.
                # El archivo físico SE MANTIENE por si el admin restaura.
                song.is_archived = True
                archived_count += 1
        
        if archived_count > 0:
            db.session.commit()
            audit_logger.info(f"Limpieza (Archivado): {archived_count} canciones movidas al archivo.")

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
