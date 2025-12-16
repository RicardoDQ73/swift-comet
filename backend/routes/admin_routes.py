from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Song
from utils.logger import audit_logger
from werkzeug.utils import secure_filename
import os
from datetime import datetime

admin_bp = Blueprint('admin', __name__)

ALLOWED_EXTENSIONS = {'mp3', 'wav'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def check_admin():
    """Helper para verificar si el usuario es admin"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'admin':
        return False
    return True

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def list_users():
    """RF10: Listar todos los docentes registrados"""
    if not check_admin():
        return jsonify({'error': 'Acceso denegado'}), 403

    users = User.query.all()
    results = []
    for u in users:
        results.append({
            'id': u.id,
            'name': u.name,
            'email': u.email,
            'role': u.role,
            'grade_level': u.grade_level,
            'joined_at': u.created_at.isoformat()
        })
    return jsonify(results), 200

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """RF10: Eliminar un docente"""
    if not check_admin():
        return jsonify({'error': 'Acceso denegado'}), 403
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
        
    db.session.delete(user)
    db.session.commit()
    audit_logger.warning(f"ADMIN eliminó al usuario {user.email}")
    return jsonify({'message': 'Usuario eliminado'}), 200

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """RF10: Editar información de un usuario"""
    if not check_admin():
        return jsonify({'error': 'Acceso denegado'}), 403
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
        
    data = request.get_json()
    
    # Actualizar campos permitidos
    if 'name' in data:
        user.name = data['name']
    if 'role' in data:
        user.role = data['role']
    if 'grade_level' in data:
        user.grade_level = data['grade_level']
        
    db.session.commit()
    audit_logger.info(f"ADMIN actualizó al usuario {user.email}")
    return jsonify({'message': 'Usuario actualizado correctamente'}), 200

@admin_bp.route('/monitor', methods=['GET'])
@jwt_required()
def monitor_activity():
    """RF11: Ver actividad reciente (Auditoría)"""
    if not check_admin():
        return jsonify({'error': 'Acceso denegado'}), 403
        
    # Por ahora devolvemos las últimas 50 canciones generadas por cualquiera
    songs = Song.query.order_by(Song.created_at.desc()).limit(50).all()
    
    results = []
    for s in songs:
        results.append({
            'id': s.id,
            'title': s.title,
            'author': s.author.name,
            'created_at': s.created_at.isoformat(),
            'tags': s.tags
        })
    return jsonify(results), 200

@admin_bp.route('/upload-song', methods=['POST'])
@jwt_required()
def upload_song():
    """Subir canción manualmente (solo admin)"""
    if not check_admin():
        return jsonify({'error': 'Acceso denegado'}), 403
    
    # Verificar que se envió un archivo
    if 'audio_file' not in request.files:
        return jsonify({'error': 'No se envió ningún archivo'}), 400
    
    file = request.files['audio_file']
    
    if file.filename == '':
        return jsonify({'error': 'Nombre de archivo vacío'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Solo se permiten archivos MP3 o WAV'}), 400
    
    # Datos del formulario
    title = request.form.get('title', 'Canción sin título')
    lyrics = request.form.get('lyrics', '')
    tags_str = request.form.get('tags', '')
    
    # Guardar archivo
    filename = secure_filename(file.filename)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    unique_filename = f"{timestamp}_{filename}"
    
    from flask import current_app
    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, unique_filename)
    file.save(file_path)
    
    # Crear entrada en base de datos
    user_id = get_jwt_identity()
    audio_url = f"/static/music/{unique_filename}"
    
    # Procesar tags
    tags_dict = {}
    if tags_str:
        tags_list = [t.strip() for t in tags_str.split(',')]
        for i, tag in enumerate(tags_list):
            tags_dict[f'tag_{i}'] = tag
    
    new_song = Song(
        title=title,
        audio_url=audio_url,
        lyrics=lyrics,
        tags=tags_dict,
        user_id=user_id
    )
    
    db.session.add(new_song)
    db.session.commit()
    
    audit_logger.info(f"ADMIN subió canción: {title}")
    
    return jsonify({
        'message': 'Canción subida exitosamente',
        'song': {
            'id': new_song.id,
            'title': new_song.title,
            'audio_url': audio_url
        }
    }), 201
