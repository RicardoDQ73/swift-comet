from app import create_app, db
from models import User

def list_users():
    app = create_app()
    with app.app_context():
        users = User.query.all()
        print(f"\n--- USUARIOS EN BASE DE DATOS ({len(users)}) ---")
        if not users:
            print("No hay usuarios registrados.")
        for user in users:
            print(f"ID: {user.id} | Nombre: {user.name} | Email: {user.email} | Rol: {user.role}")
        print("-----------------------------------")

if __name__ == "__main__":
    list_users()
