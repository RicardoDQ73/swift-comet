import os
from datetime import timedelta

class Config:
    """
    Clase de Configuración Base.
    Aquí definimos las 'reglas del juego' para nuestra aplicación.
    
    Por qué hacerlo así:
    1. Seguridad: No quemamos contraseñas en el código.
    2. Orden: Todo lo configurable está en un solo lugar.
    """
    
    # Clave secreta para firmar los tokens de sesión (JWT).
    # En producción, esto vendría de una variable de entorno oculta.
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'tesis-secret-key-2024'
    
    # Configuración de la Base de Datos (PostgreSQL)
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    
    # Leemos las credenciales desde variables de entorno.
    DB_USER = os.environ.get('DB_USER', 'postgres')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', 'admin123')
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_PORT = os.environ.get('DB_PORT', '5432')
    DB_NAME = os.environ.get('DB_NAME', 'tesis_music_app')
    
    SQLALCHEMY_DATABASE_URI = f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
    
    # Desactivamos notificaciones pesadas de cambios en la BD para mejorar rendimiento.
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Configuración de JWT (Tokens de Seguridad)
    # Los tokens de acceso expiran en 1 hora por seguridad (RNF-03).
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-super-secret'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)

    # Carpeta donde guardaremos los archivos de audio generados
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'music')
