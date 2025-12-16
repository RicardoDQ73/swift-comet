import logging
import os
from logging.handlers import RotatingFileHandler

def setup_logger():
    """
    Configura el sistema de Auditoría (Logs).
    RNF-15: Registrar acciones críticas.
    """
    if not os.path.exists('logs'):
        os.mkdir('logs')

    # Configuración básica
    logger = logging.getLogger('tesis_app')
    logger.setLevel(logging.INFO)

    # Handler para escribir en archivo (rota cada 1MB, guarda 10 archivos)
    file_handler = RotatingFileHandler('logs/app.log', maxBytes=1024*1024, backupCount=10)
    
    # Formato: [Fecha] [Nivel] [Mensaje]
    formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s')
    file_handler.setFormatter(formatter)
    
    logger.addHandler(file_handler)
    
    # También mostrar en consola
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    return logger

# Instancia global para usar en toda la app
audit_logger = setup_logger()
