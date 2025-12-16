from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Song
from utils.logger import audit_logger

admin_bp = Blueprint('admin', __name__)

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
