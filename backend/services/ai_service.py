import time
import random

def generate_music_mock(prompt, duration=10):
    """
    Simula la generación de música por IA.
    En la fase final, esto se reemplazará por una llamada a HuggingFace API.
    """
    # Simular tiempo de procesamiento (La IA tarda un poco)
    time.sleep(2)
    
    # Lista de canciones de prueba (URLs públicas o archivos locales)
    # Para el prototipo, usaremos unos archivos placeholder
    mock_responses = [
        {
            "filename": "demo_piano_happy.mp3",
            "tags": {"instrumento": "Piano", "ritmo": "Alegre", "curso": "Matemática"},
            "lyrics": "Uno, dos, tres, vamos a contar..."
        },
        {
            "filename": "demo_guitar_calm.mp3",
            "tags": {"instrumento": "Guitarra", "ritmo": "Lento", "curso": "Comunicación"},
            "lyrics": "Había una vez un barquito chiquitito..."
        },
        {
            "filename": "demo_flute_march.mp3",
            "tags": {"instrumento": "Flauta", "ritmo": "Marcha", "curso": "Psicomotricidad"},
            "lyrics": "Marchando, marchando, te voy saludando..."
        }
    ]
    
    # Seleccionar uno al azar para variar
    result = random.choice(mock_responses)
    
    return result
