import time
import random
import os
import httpx
import requests
from flask import current_app
from werkzeug.utils import secure_filename
import uuid

REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")

def generate_music_real(prompt, duration=10, model_type='instrumental', lyrics=None):
    """
    Dispatcher para generación de música.
    - model_type='instrumental': Usa MusicGen (rápido, fondo).
    - model_type='vocal': Usa Minimax (lento, canción completa, requiere lyrics).
    """
    if not REPLICATE_API_TOKEN:
        raise Exception("REPLICATE_API_TOKEN not configured in .env")
        
    if model_type == 'vocal':
        return _generate_minimax(prompt, lyrics)
    else:
        return _generate_musicgen(prompt, duration)

import base64

def _generate_musicgen(prompt, duration=10):
    print(f"Generando INSTRUMENTAL con MusicGen. Prompt: {prompt}...")
    headers = {
        "Authorization": f"Token {REPLICATE_API_TOKEN}",
        "Content-Type": "application/json"
    }

    # Usamos musicgen-songstarter o similar, o el meta/musicgen básico
    # Model: meta/musicgen:b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38
    # O mejor usar el endpoint de predictions generico y dejar que el helper maneje la version si usamos ID via path (no, helper usa URL).
    # Vamos a usar la URL de modelo especifica de replicate para musicgen standard.
    
    # Version 'large' de musicgen
    version = "7a76a8258b23fae65c5a22debb8841d1d7e816b75c2f24218cd2bd8573787906"
    
    payload = {
        "version": version,
        "input": {
            "prompt": prompt,
            "duration": duration,
            "model_version": "large",
            "output_format": "mp3"
        }
    }
    
    return _call_replicate(headers, payload, "MusicGen Instrumental")


def _generate_minimax(prompt, lyrics):
    print(f"Generando VOZ con Minimax (HTTP/Base64). Prompt: {prompt}...")
    
    # 1. Buscar Voz del Sistema
    sys_voice_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'system', 'system_voice.mp3')
    
    if not os.path.exists(sys_voice_path):
        raise Exception("Error: No hay 'Voz del Sistema' configurada. Por favor sube una en el Admin.")

    # 1.5 Generar Referencia de Estilo Dinámica (PROD)
    # En vez de usar siempre el system_style, generamos uno nuevo basado en el prompt del usuario
    # para que la canción tenga el mood correcto (triste, alegre, rock, etc).
    print(f"[{time.strftime('%H:%M:%S')}] Generando backing track único para esta canción...")
    try:
        # Usamos el prompt del usuario para generar el instrumental
        # Force upbeat/clean style to ensure good vocal match, or just use user prompt
        instr_result = _generate_musicgen(prompt, duration=15)
        
        gen_filename = instr_result['filename']
        # Full path to generated instrumental
        temp_style_path = os.path.join(current_app.config['UPLOAD_FOLDER'], gen_filename)
        
        print(f"[{time.strftime('%H:%M:%S')}] Backing track generado: {gen_filename}")
        
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] WARNING: Falló generación dinámica de estilo: {e}")
        # Fallback to system style if generation fails
        sys_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'system')
        if not os.path.exists(sys_dir): os.makedirs(sys_dir)
        
        sys_style_path_mp3 = os.path.join(sys_dir, 'system_style.mp3')
        sys_style_path_wav = os.path.join(sys_dir, 'system_style.wav')
        temp_style_path = sys_style_path_mp3 if os.path.exists(sys_style_path_mp3) else (sys_style_path_wav if os.path.exists(sys_style_path_wav) else None)
        
        if not temp_style_path:
             # Last resort fallback if no system style exists either
             print("No system style found, using voice as instrumental ref (bad quality but works)")
             temp_style_path = sys_voice_path

    try:
        # Importar base64
        import base64
        
        # 2. Preparar Payload HTTP
        # VOZ (Asumimos MP3 sistema, pero validamos)
        voice_mime = "audio/mpeg" if sys_voice_path.endswith('.mp3') else "audio/wav"
        with open(sys_voice_path, "rb") as voice_file:
            voice_encoded = base64.b64encode(voice_file.read()).decode('utf-8')
            voice_data_uri = f"data:{voice_mime};base64,{voice_encoded}"

        # ESTILO (Usamos el temp_style_path generado o fallback)
        style_mime = "audio/mpeg" if temp_style_path.endswith('.mp3') else "audio/wav"
        with open(temp_style_path, "rb") as style_file:
            style_encoded = base64.b64encode(style_file.read()).decode('utf-8')
            style_data_uri = f"data:{style_mime};base64,{style_encoded}"

        headers = {
            "Authorization": f"Token {REPLICATE_API_TOKEN}",
            "Content-Type": "application/json"
        }

        # USAR ENDPOINT DE MODELO DIRECTO
        endpoint_url = "https://api.replicate.com/v1/models/minimax/music-01/predictions"

        payload = {
            "input": {
                "prompt": prompt,
                "lyrics": lyrics,
                # voice_file: La voz que queremos clonar (que contiene vocals)
                "voice_file": voice_data_uri,
                # refer_instrumental: La referencia de ESTILO (Instrumental)
                # ERROR: Search confirma que es 'instrumental_file'
                "instrumental_file": style_data_uri,
                "model_name": "music-01"
            }
        }
        
        return _call_replicate(headers, payload, "Minimax Vocal", custom_url=endpoint_url)

    except Exception as e:
        print(f"General Error in Minimax: {e}")
        import traceback
        traceback.print_exc()
        raise Exception(f"Error generando: {str(e)}")

def _call_replicate(headers, payload, label, custom_url=None):
    url = custom_url if custom_url else "https://api.replicate.com/v1/predictions"
    # Aumentamos timeout a 300s para igualar al frontend
    with httpx.Client(timeout=300) as client: 
        response = client.post(
            url,
            headers=headers,
            json=payload
        )
        if response.status_code not in [200, 201]:
             error_detail = response.text
             print(f"Replicate Error ({label}): {error_detail}")
             print(f"URL Used: {url}")
             raise Exception(f"Replicate API Error: {response.status_code} - {error_detail}")

        prediction = response.json()
        prediction_id = prediction["id"]
        
        print(f"[{label}] Predicción creada: {prediction_id}")
        
        max_attempts = 100
        for attempt in range(max_attempts):
            time.sleep(4) # Slower poll
            status_response = client.get(
                f"https://api.replicate.com/v1/predictions/{prediction_id}",
                headers=headers
            )
            status_response.raise_for_status()
            status_data = status_response.json()
            
            status = status_data["status"]
            print(f"[{label}] Estado: {status}")
            
            if status == "succeeded":
                audio_url = status_data["output"]
                break
            elif status == "failed":
                raise Exception(f"Generación falló: {status_data.get('error', 'Unknown error')}")
        else:
            raise Exception("Timeout esperando generación")
    
    if not audio_url:
        raise Exception("No se recibió URL de audio")
        
    print(f"Audio recibido: {audio_url}")
    
    # Download
    response = requests.get(audio_url)
    if response.status_code != 200:
        raise Exception("Error descargando audio final")
        
    content_type = response.headers.get('Content-Type', '')
    if 'wav' in content_type or 'audio/x-wav' in content_type:
        ext = 'wav'
    else:
        ext = 'mp3'
        
    filename = f"ai_{uuid.uuid4().hex}.{ext}"
    save_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    
    with open(save_path, 'wb') as f:
        f.write(response.content)
        
    tags = {
        "instrumento": "IA Vocal", 
        "estilo": payload['input']['prompt'][:15]
    } if "lyrics" in payload['input'] else {
         "instrumento": "IA Instrumental", 
         "estilo": payload['input']['prompt'][:15]
    }

    return {
        "filename": filename,
        "tags": tags,
        "lyrics": payload['input'].get('lyrics', f"Prompt: {payload['input']['prompt']}")
    }

# Mantener mock por si acaso
def generate_music_mock(prompt, duration=10):
    time.sleep(2)
    mock_responses = [
        {
            "filename": "demo_piano_happy.mp3",
            "tags": {"instrumento": "Piano", "ritmo": "Alegre", "curso": "Matemática"},
            "lyrics": "Uno, dos, tres, vamos a contar..."
        }
    ]
    return random.choice(mock_responses)
