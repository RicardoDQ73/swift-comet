from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Song, Favorite, User
from services.ai_service import generate_music_real, generate_music_mock
from utils.logger import audit_logger
from datetime import datetime, timedelta

music_bp = Blueprint('music', __name__)

@music_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_music():
    """
    RF04: Generar Música con IA.
    Recibe: prompt (texto), duration.
    Guarda en Historial Temporal (RF07).
    """
    user_id = int(get_jwt_identity())
    data = request.get_json()
    prompt = data.get('prompt')

    if not prompt:
        return jsonify({'error': 'El prompt es obligatorio'}), 400

    try:
        # 1. Llamar al servicio de IA (Real con Replicate)
        ai_result = generate_music_real(prompt, duration=10)
        
        # 2. Guardar en Base de Datos (Historial)
        new_song = Song(
            user_id=user_id,
            title=f"Canción sobre {prompt[:20]}...",
            prompt=prompt,
            audio_filename=ai_result['filename'],
            tags=ai_result['tags'],
            lyrics=ai_result['lyrics'],
            duration=10
        )
        
        db.session.add(new_song)
        db.session.commit()
        
        audit_logger.info(f"Música generada por User {user_id}: {prompt}")
        
        return jsonify({
            'message': 'Música generada exitosamente',
            'song': {
                'id': new_song.id,
                'title': new_song.title,
                'audio_url': f"/static/music/{new_song.audio_filename}",
                'tags': new_song.tags,
                'lyrics': new_song.lyrics
            }
        }), 201

    except Exception as e:
        audit_logger.error(f"Error generando música: {str(e)}")
        return jsonify({'error': 'Error en el motor de IA'}), 500

@music_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    """
    RF11: Ver Historial.
    Devuelve canciones de las últimas 24h.
    Soporta filtros por query params (?tag=Piano).
    """
    user_id = int(get_jwt_identity())
    
    # Filtro de tiempo (24h)
    since = datetime.utcnow() - timedelta(hours=24)
    
    query = Song.query.filter_by(user_id=user_id).filter(Song.created_at >= since)
    
    # Filtros adicionales (Buscador)
    search = request.args.get('search')
    if search:
        query = query.filter(Song.title.contains(search))

    songs = query.order_by(Song.created_at.desc()).all()
    
    results = []
    for s in songs:
        # Verificar si es favorita
        is_fav = Favorite.query.filter_by(user_id=user_id, song_id=s.id).first() is not None
        results.append({
            'id': s.id,
            'title': s.title,
            'created_at': s.created_at.isoformat(),
            'tags': s.tags,
            'is_favorite': is_fav,
            'audio_url': f"/static/music/{s.audio_filename}"
        })

    return jsonify(results), 200

@music_bp.route('/favorites', methods=['POST'])
@jwt_required()
def add_favorite():
    """
    RF08: Guardar en Favoritos.
    Evita que se borre a las 24h.
    """
    user_id = int(get_jwt_identity())
    data = request.get_json()
    song_id = data.get('song_id')
    
    song = Song.query.get(song_id)
    if not song or song.user_id != user_id:
        return jsonify({'error': 'Canción no encontrada'}), 404
        
    # Verificar si ya existe
    existing = Favorite.query.filter_by(user_id=user_id, song_id=song_id).first()
    if existing:
        return jsonify({'message': 'Ya está en favoritos'}), 200
        
    new_fav = Favorite(user_id=user_id, song_id=song_id)
    db.session.add(new_fav)
    db.session.commit()
    
    audit_logger.info(f"User {user_id} guardó en favoritos Song {song_id}")
    return jsonify({'message': 'Guardado en favoritos'}), 201

@music_bp.route('/favorites', methods=['GET'])
@jwt_required()
def get_favorites():
    """
    RF08: Listar Favoritos.
    """
    user_id = int(get_jwt_identity())
    favorites = Favorite.query.filter_by(user_id=user_id).all()
    
    results = []
    for fav in favorites:
        s = fav.song
        results.append({
            'id': s.id,
            'title': s.title,
            'tags': s.tags,
            'audio_url': f"/static/music/{s.audio_filename}",
            'favorited_at': fav.favorited_at.isoformat(),
            'is_favorite': True
        })
        
    return jsonify(results), 200

@music_bp.route('/favorites/<int:song_id>', methods=['DELETE'])
@jwt_required()
def remove_favorite(song_id):
    """
    RF09: Eliminar de Favoritos.
    """
    user_id = int(get_jwt_identity())
    fav = Favorite.query.filter_by(user_id=user_id, song_id=song_id).first()
    
    if not fav:
        return jsonify({'error': 'No encontrado en favoritos'}), 404
        
    db.session.delete(fav)
    db.session.commit()
    audit_logger.info(f"User {user_id} eliminó de favoritos Song {song_id}")
    return jsonify({'message': 'Eliminado de favoritos'}), 200
