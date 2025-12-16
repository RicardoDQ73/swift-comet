from flask import Blueprint, request, jsonify
from services.tts_service import generate_tts_audio

tts_bp = Blueprint('tts', __name__)

@tts_bp.route('/speak', methods=['POST'])
def speak():
    data = request.get_json()
    text = data.get('text')
    
    if not text:
        return jsonify({'error': 'Texto requerido'}), 400
        
    audio_url = generate_tts_audio(text)
    
    if not audio_url:
        return jsonify({'error': 'Error generando audio'}), 500
        
    # Retornamos la URL completa suponiendo que el frontend usa la misma base
    return jsonify({'audio_url': audio_url}), 200
