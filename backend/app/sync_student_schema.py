import sys
from sqlalchemy import text
from app.database import engine, Base
import app.models

def sync_schema():
    print("Checking and creating any new database tables...")
    Base.metadata.create_all(bind=engine)

    print("Adding any missing columns to existing tables safely...")
    with engine.connect() as conn:
        # Students personalization columns
        conn.execute(text("ALTER TABLE students ADD COLUMN IF NOT EXISTS nickname VARCHAR(50);"))
        conn.execute(text("ALTER TABLE students ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR(500);"))
        conn.execute(text("ALTER TABLE students ADD COLUMN IF NOT EXISTS department VARCHAR(100);"))
        conn.execute(text("ALTER TABLE students ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50);"))
        conn.commit()
    print("VAHMITRA Student Portal schema synchronized successfully!")

if __name__ == "__main__":
    try:
        sync_schema()
    except Exception as e:
        print(f"Schema sync notice: {e}")
        sys.exit(0)

