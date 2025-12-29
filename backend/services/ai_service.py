import time
import random
import os
import httpx
import requests
from flask import current_app
from werkzeug.utils import secure_filename
import uuid

REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")

def generate_music_real(prompt, duration=10):
    """
    Genera música real usando Replicate API directamente (sin SDK).
    Descarga el archivo resultante a la carpeta static/music local.
    """
    if not REPLICATE_API_TOKEN:
        raise Exception("REPLICATE_API_TOKEN not configured in .env")
    
    print(f"Generando música con prompt: {prompt}...")
    
    # Usar API direct de Replicate
    headers = {
        "Authorization": f"Token {REPLICATE_API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # Modelo: pphu/musicgen-small
    payload = {
        "version": "65f6182bfcbc05fc05a28c78f1fbb9ddd1d8fd4ff439f4d9043d6aa8cd515dc1",
        "input": {
            "prompt": prompt,
            "duration": duration
        }
    }
    
    # Crear predicción
    with httpx.Client(timeout=120) as client:
        response = client.post(
            "https://api.replicate.com/v1/predictions",
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        prediction = response.json()
        prediction_id = prediction["id"]
        
        print(f"Predicción creada: {prediction_id}")
        print(f"Monitor URL: https://replicate.com/p/{prediction_id}")
        
        # Esperar a que termine (polling)
        max_attempts = 100  # 100 intentos * 3s = 5 minutos max
        for attempt in range(max_attempts):
            time.sleep(3)
            status_response = client.get(
                f"https://api.replicate.com/v1/predictions/{prediction_id}",
                headers=headers
            )
            status_response.raise_for_status()
            status_data = status_response.json()
            
            current_status = status_data.get("status")
            print(f"Estado ({attempt+1}/{max_attempts}): {current_status}")
            
            status = status_data["status"]
            print(f"Estado: {status}")
            
            if status == "succeeded":
                audio_url = status_data["output"]
                break
            elif status == "failed":
                raise Exception(f"Generación falló: {status_data.get('error', 'Unknown error')}")
        else:
            raise Exception("Timeout esperando generación")
    
    if not audio_url:
        raise Exception("No se recibió URL de audio de Replicate")

    print(f"Audio generado en: {audio_url}")
    
    # Descargar el archivo
    response = requests.get(audio_url)
    if response.status_code != 200:
        raise Exception("Error al descargar el audio generado")
        
    # Crear nombre de archivo único
    filename = f"ai_{uuid.uuid4().hex}.mp3"
    
    # Ruta de guardado
    save_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    
    with open(save_path, 'wb') as f:
        f.write(response.content)
        
    print(f"Archivo guardado en: {save_path}")
    
    # Devolver estructura compatible
    return {
        "filename": filename,
        "tags": {"instrumento": "IA", "estilo": "Generado", "prompt": prompt[:10]},
        "lyrics": f"Melodía generada por IA inspirada en: {prompt}"
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
