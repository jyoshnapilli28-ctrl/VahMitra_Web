
from getpass import getpass

from app.database import SessionLocal
from app.models import User
from app.security import hash_password


def create_admin():
    db = SessionLocal()

    try:
        username = input("Enter management username: ").strip()

        existing_user = db.query(User).filter(
            User.username == username
        ).first()

        if existing_user:
            print("Username already exists.")
            return

        password = getpass("Enter management password: ")

        if len(password) < 12:
            print("Password must contain at least 12 characters.")
            return

        confirm_password = getpass("Confirm password: ")

        if password != confirm_password:
            print("Passwords do not match.")
            return

        admin = User(
            username=username,
            password_hash=hash_password(password),
            role="management",
            is_active=True
        )

        db.add(admin)
        db.commit()

        print("Management account created successfully!")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
