from app import create_app, db
from models import User
from flask_bcrypt import Bcrypt

def create_admin():
    app = create_app()
    bcrypt = Bcrypt(app)
    
    with app.app_context():
        # Verificar si ya existe
        email = "admin@swiftcomet.com"
        existing = User.query.filter_by(email=email).first()
        
        if existing:
            print(f"El usuario admin {email} ya existe.")
            # Opcional: Actualizarlo a admin si no lo es
            if existing.role != 'admin':
                existing.role = 'admin'
                db.session.commit()
                print("Se actualizó el rol a 'admin'.")
            return

        # Crear nuevo admin
        password = "AdminSecretPassword123!"
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        
        new_admin = User(
            name="Super Admin",
            email=email,
            password_hash=hashed_password,
            role='admin',
            grade_level='Superuser'
        )
        
        db.session.add(new_admin)
        db.session.commit()
        
        print(f"\n✅ Usuario Admin creado exitosamente:")
        print(f"Email: {email}")
        print(f"Password: {password}")
        print("-----------------------------------")

if __name__ == "__main__":
    create_admin()
