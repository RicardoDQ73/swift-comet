import edge_tts
import uuid
import os
import asyncio
from config import Config

# Asegurar que el directorio existe
TTS_DIR = os.path.join(Config.BASE_DIR, 'static', 'tts')
os.makedirs(TTS_DIR, exist_ok=True)

VOICE = "es-PE-CamilaNeural"  # Voz natural de Perú

async def _generate_audio_file(text, output_path):
    communicate = edge_tts.Communicate(text, VOICE)
    await communicate.save(output_path)

def generate_tts_audio(text):
    """
    Genera un archivo de audio MP3 para el texto dado.
    Retorna la ruta relativa para servirlo.
    """
    filename = f"{uuid.uuid4()}.mp3"
    output_path = os.path.join(TTS_DIR, filename)
    
    # Ejecutar la función asíncrona de manera síncrona
    try:
        asyncio.run(_generate_audio_file(text, output_path))
        
        # Retornar URL relativa para el frontend
        return f"/static/tts/{filename}"
    except Exception as e:
        print(f"Error generando TTS: {e}")
        return None
