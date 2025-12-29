from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSON  # Usamos JSON para guardar las etiquetas

# Inicializamos la extensión de Base de Datos
db = SQLAlchemy()

class User(db.Model):
    """
    Modelo de Usuario (Docente o Admin).
    Representa la tabla 'users' en la base de datos.
    """
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), default='docente')  # 'admin' o 'docente'
    grade_level = db.Column(db.String(50))  # Ej: '3 años', '4 años' (Nuevo requerimiento)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relaciones: Un usuario tiene muchas canciones y muchos favoritos
    songs = db.relationship('Song', backref='author', lazy=True)
    favorites = db.relationship('Favorite', backref='user', lazy=True)

    def __repr__(self):
        return f'<User {self.name}>'

class Song(db.Model):
    """
    Modelo de Canción Generada.
    Representa la tabla 'songs'.
    Esta tabla funciona como el HISTORIAL.
    """
    __tablename__ = 'songs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    title = db.Column(db.String(200), nullable=False)
    prompt = db.Column(db.Text, nullable=False)  # Lo que el usuario pidió (Voz/Texto)
    audio_filename = db.Column(db.String(255), nullable=False)  # Ruta al archivo MP3
    lyrics = db.Column(db.Text)  # Letra de la canción (Nuevo requerimiento)
    tags = db.Column(JSON)  # Etiquetas: {'curso': 'Matemática', 'instrumento': 'Piano'}
    duration = db.Column(db.Integer)  # En segundos
    
    # Tipo de cancion: 'GENERATED' (IA) o 'COVER' (Karaoke Mix)
    song_type = db.Column(db.String(20), default='GENERATED')
    
    # Campo para Soft Delete (Archivado)
    is_archived = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Campo calculado para saber si es favorita (se llenará en tiempo de ejecución)
    is_favorite = False 

    def __repr__(self):
        return f'<Song {self.title}>'

class Favorite(db.Model):
    """
    Modelo de Favoritos.
    Tabla intermedia para guardar qué canciones le gustaron al usuario.
    Esto evita que se borren con la limpieza de 24h.
    """
    __tablename__ = 'favorites'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    song_id = db.Column(db.Integer, db.ForeignKey('songs.id'), nullable=False)
    favorited_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relación para acceder a los datos de la canción desde el favorito
    song = db.relationship('Song', backref='favorites_entries')

    def __repr__(self):
        return f'<Favorite User:{self.user_id} Song:{self.song_id}>'

class Event(db.Model):
    """
    Modelo de Evento (Lista de Reproducción Compartida).
    """
    __tablename__ = 'events'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relación: Un evento tiene muchas canciones, si se borra evento se borran entradas
    songs = db.relationship('EventSong', backref='event', lazy=True, cascade="all, delete-orphan")
    # Relación: Saber quién creó el evento
    creator = db.relationship('User', backref='created_events', foreign_keys=[created_by])

class EventSong(db.Model):
    """
    Tabla intermedia: Canciones dentro de un Evento.
    Guarda quién agregó la canción.
    """
    __tablename__ = 'event_songs'

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)
    song_id = db.Column(db.Integer, db.ForeignKey('songs.id'), nullable=False)
    added_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    added_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    order = db.Column(db.Integer, default=0)

    # Relaciones
    song = db.relationship('Song') # Acceso a datos de la canción
    user = db.relationship('User', foreign_keys=[added_by]) # Quién la subió
