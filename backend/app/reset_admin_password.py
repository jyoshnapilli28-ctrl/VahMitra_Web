
from getpass import getpass

from app.database import SessionLocal
from app.models import User
from app.security import hash_password


def reset_password():
    db = SessionLocal()

    try:
        username = "srmap@vahmitra"

        user = db.query(User).filter(
            User.username == username
        ).first()

        if not user:
            print("Management account not found.")
            return

        password = getpass("Enter new password: ")

        if len(password) < 12:
            print("Password must contain at least 12 characters.")
            return

        confirm = getpass("Confirm new password: ")

        if password != confirm:
            print("Passwords do not match.")
            return

        user.password_hash = hash_password(password)
        db.commit()

        print("Management password reset successfully.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    reset_password()
