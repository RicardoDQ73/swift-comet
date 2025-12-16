import sqlite3
import os

# Conectar a la base de datos
db_path = 'tesis_music_app.db'
if not os.path.exists(db_path):
    print(f"No se encontró la base de datos en {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id, email, name, grade_level, role FROM user")
        users = cursor.fetchall()

        print(f"{'ID':<5} {'Email':<30} {'Nombre':<20} {'Grado':<15} {'Rol':<10}")
        print("-" * 80)
        for user in users:
            print(f"{user[0]:<5} {user[1]:<30} {user[2]:<20} {user[3]:<15} {user[4]:<10}")
            
        if not users:
            print("No hay usuarios registrados.")

    except sqlite3.Error as e:
        print(f"Error leyendo la base de datos: {e}")
    finally:
        conn.close()
