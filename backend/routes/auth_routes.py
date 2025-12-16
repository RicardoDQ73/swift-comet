from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from models import db, User
from utils.logger import audit_logger

# Creamos el Blueprint (un grupo de rutas)
auth_bp = Blueprint('auth', __name__)
bcrypt = Bcrypt()

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    RF01: Registro de Docentes.
    Recibe: name, email, password, grade_level.
    """
    data = request.get_json()
    
    # Validación básica
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Faltan datos obligatorios'}), 400
    
    # Verificar si ya existe
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'El correo ya está registrado'}), 409

    # Encriptar contraseña (RNF-03)
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')

    # Crear usuario
    new_user = User(
        name=data['name'],
        email=data['email'],
        password_hash=hashed_password,
        grade_level=data.get('grade_level'), # Nuevo campo
        role='docente' # Por defecto todos son docentes
    )

    try:
        db.session.add(new_user)
        db.session.commit()
        audit_logger.info(f"Nuevo usuario registrado: {new_user.email}")
        return jsonify({'message': 'Usuario registrado exitosamente'}), 201
    except Exception as e:
        db.session.rollback()
        audit_logger.error(f"Error en registro: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    RF02: Inicio de Sesión.
    Devuelve un JWT Token si las credenciales son válidas.
    """
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()

    # Verificar contraseña
    if user and bcrypt.check_password_hash(user.password_hash, data.get('password')):
        # Crear token
        access_token = create_access_token(identity=str(user.id))
        audit_logger.info(f"Login exitoso: {user.email}")
        
        return jsonify({
            'message': 'Login exitoso',
            'token': access_token,
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'grade_level': user.grade_level
            }
        }), 200
    
    audit_logger.warning(f"Intento de login fallido: {data.get('email')}")
    return jsonify({'error': 'Credenciales inválidas'}), 401

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """
    RF03: Actualizar Perfil.
    Permite cambiar nombre y grado.
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    data = request.get_json()

    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404

    # Actualizar campos permitidos
    if 'name' in data:
        user.name = data['name']
    if 'grade_level' in data:
        user.grade_level = data['grade_level']
    
    # Si quiere cambiar contraseña
    if 'password' in data:
        user.password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')

    try:
        db.session.commit()
        audit_logger.info(f"Perfil actualizado: {user.email}")
        return jsonify({'message': 'Perfil actualizado correctamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Error al actualizar'}), 500

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """
    Simulación de recuperación de contraseña.
    En un sistema real, enviaría un correo.
    """
    data = request.get_json()
    email = data.get('email')
    # Aquí iría la lógica de envío de email (SendGrid/SMTP)
    # Para la tesis, simulamos el éxito.
    audit_logger.info(f"Solicitud de recuperación de contraseña para: {email}")
    return jsonify({'message': 'Si el correo existe, se ha enviado un enlace de recuperación.'}), 200
