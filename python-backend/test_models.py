from app.database import SessionLocal
from app.models.user import User
from sqlalchemy import text

def test_user_query():
    db = SessionLocal()
    try:
        print("Testing User model query...")
        users = db.query(User).limit(5).all()
        print(f"Found {len(users)} users.")
        for user in users:
            print(f" - ID: {user.id}, Email: {user.email}, Phone: {user.phone_number}")
            
        print("\n✅ User model mapping works!")
    except Exception as e:
        print(f"❌ Error querying users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_user_query()
