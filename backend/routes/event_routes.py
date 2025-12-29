from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Event, EventSong, Song, User, Favorite
from utils.logger import audit_logger
from datetime import datetime
import os
from werkzeug.utils import secure_filename

event_bp = Blueprint('events', __name__)

def get_current_user_role(user_id):
    user = User.query.get(user_id)
    return user.role if user else None

@event_bp.route('/', methods=['GET'])
@jwt_required()
def list_events():
    """Listar eventos activos."""
    events = Event.query.filter_by(is_active=True).order_by(Event.created_at.desc()).all()
    results = []
    for e in events:
        results.append({
            'id': e.id,
            'title': e.title,
            'description': e.description,
            'created_by': e.creator.name,
            'song_count': len(e.songs),
            'created_at': e.created_at.isoformat()
        })
    return jsonify(results), 200

@event_bp.route('/', methods=['POST'])
@jwt_required()
def create_event():
    """Crear nuevo evento (Solo Admin)."""
    user_id = int(get_jwt_identity())
    role = get_current_user_role(user_id)
    
    if role != 'admin':
        return jsonify({'error': 'No autorizado'}), 403
        
    data = request.get_json()
    if not data or not data.get('title'):
        return jsonify({'error': 'El título es obligatorio'}), 400
        
    new_event = Event(
        title=data['title'],
        description=data.get('description', ''),
        created_by=user_id
    )
    
    db.session.add(new_event)
    db.session.commit()
    
    audit_logger.info(f"Admin {user_id} creó evento {new_event.title}")
    return jsonify({'message': 'Evento creado', 'event_id': new_event.id}), 201

@event_bp.route('/<int:event_id>', methods=['GET'])
@jwt_required()
def get_event_details(event_id):
    print(f"DEBUG: get_event_details called for ID={event_id}")
    """Obtener detalles y canciones del evento."""
    event = Event.query.get(event_id)
    if not event:
        print(f"DEBUG: Event ID={event_id} NOT FOUND in DB")
        return jsonify({'error': 'Evento no encontrado'}), 404
        
    print(f"DEBUG: Event Found: {event.title}")
    
    user_id = int(get_jwt_identity())
    print(f"DEBUG: Request by User ID={user_id}")
    
    # Ordenar por 'order' ascendente
    sorted_songs = sorted(event.songs, key=lambda x: x.order or 0)
    
    songs_data = []
    for es in sorted_songs:
        song = es.song
        added_by_user = es.user
        songs_data.append({
            'event_song_id': es.id, # ID de la relación (para borrar)
            'song_id': song.id,
            'title': song.title,
            'audio_url': f"/static/music/{song.audio_filename}",
            'tags': song.tags,
            'added_by_name': added_by_user.name,
            'added_by_id': es.added_by,
            'can_delete': (es.added_by == user_id) or (get_current_user_role(user_id) == 'admin')
        })
        
    return jsonify({
        'id': event.id,
        'title': event.title,
        'description': event.description,
        'is_active': event.is_active,
        'songs': songs_data
    }), 200

@event_bp.route('/<int:event_id>/add_favorite', methods=['POST'])
@jwt_required()
def add_favorite_to_event(event_id):
    """Agregar una canción existente (de favoritos/historial) al evento."""
    user_id = int(get_jwt_identity())
    data = request.get_json()
    song_id = data.get('song_id')
    
    event = Event.query.get_or_404(event_id)
    if not event.is_active:
        return jsonify({'error': 'El evento está cerrado'}), 400
        
    # Verificar si ya está
    exists = EventSong.query.filter_by(event_id=event_id, song_id=song_id).first()
    if exists:
        return jsonify({'message': 'La canción ya está en el evento'}), 200
        
    new_entry = EventSong(
        event_id=event_id,
        song_id=song_id,
        added_by=user_id
    )
    
    db.session.add(new_entry)
    db.session.commit()
    return jsonify({'message': 'Canción agregada'}), 201

@event_bp.route('/<int:event_id>/upload', methods=['POST'])
@jwt_required()
def upload_to_event(event_id):
    """Subir archivo local directamente al evento."""
    user_id = int(get_jwt_identity())
    event = Event.query.get_or_404(event_id)
    
    if not event.is_active:
        return jsonify({'error': 'El evento está cerrado'}), 400
        
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    try:
        # 1. Guardar archivo
        filename = secure_filename(f"event_u{user_id}_{int(datetime.utcnow().timestamp())}.mp3") # Asumimos MP3 o compatible
        upload_folder = current_app.config['UPLOAD_FOLDER']
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
        
        file.save(os.path.join(upload_folder, filename))
        
        # 2. Crear Song (Tipo COVER/UPLOAD)
        title = request.form.get('title', file.filename)
        new_song = Song(
            user_id=user_id,
            title=title,
            prompt="Uploaded for Event",
            audio_filename=filename,
            tags={'source': 'upload', 'event_upload': True},
            song_type='COVER',
            duration=0
        )
        db.session.add(new_song)
        db.session.flush()
        
        # 3. Vincular al Evento
        new_entry = EventSong(
            event_id=event_id,
            song_id=new_song.id,
            added_by=user_id
        )
        db.session.add(new_entry)
        db.session.commit()
        
        return jsonify({'message': 'Canción subida y agregada'}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@event_bp.route('/<int:event_id>/songs/<int:event_song_id>', methods=['DELETE'])
@jwt_required()
def remove_song_from_event(event_id, event_song_id):
    """Quitar canción del evento."""
    user_id = int(get_jwt_identity())
    role = get_current_user_role(user_id)
    
    entry = EventSong.query.get_or_404(event_song_id)
    
    # Validar permisos: Admin o el mismo usuario que la subió
    if role != 'admin' and entry.added_by != user_id:
        return jsonify({'error': 'No tienes permiso para borrar esta canción'}), 403
        
    db.session.delete(entry)
    db.session.commit()
    return jsonify({'message': 'Canción removida del evento'}), 200

@event_bp.route('/<int:event_id>/reorder', methods=['PUT'])
@jwt_required()
def reorder_event_songs(event_id):
    """Reordenar canciones de un evento (Solo Admin)."""
    user_id = int(get_jwt_identity())
    role = get_current_user_role(user_id)
    
    if role != 'admin':
        return jsonify({'error': 'No autorizado'}), 403
        
    data = request.get_json()
    # data format: { "items": [ { "event_song_id": 1, "order": 0 }, ... ] }
    items = data.get('items', [])
    
    try:
        for item in items:
            es_id = item.get('event_song_id')
            new_order = item.get('order')
            
            # Update each EventSong
            es = EventSong.query.get(es_id)
            if es and es.event_id == event_id:
                es.order = new_order
                
        db.session.commit()
        return jsonify({'message': 'Orden actualizado'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@event_bp.route('/<int:event_id>', methods=['DELETE'])
@jwt_required()
def delete_event(event_id):
    """Eliminar un evento completo (Solo Admin)."""
    user_id = int(get_jwt_identity())
    role = get_current_user_role(user_id)
    
    if role != 'admin':
        return jsonify({'error': 'No autorizado'}), 403
        
    event = Event.query.get_or_404(event_id)
    
    try:
        # Cascade delete is handled by DB model usually, but let's be explicit if needed.
        # SQLAlchemy cascade="all, delete-orphan" on relationship should handle songs.
        db.session.delete(event)
        db.session.commit()
        audit_logger.info(f"Admin {user_id} eliminó evento {event.title} (ID: {event_id})")
        return jsonify({'message': 'Evento eliminado'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
