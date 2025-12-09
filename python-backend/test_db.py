from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

database_url = os.getenv("DATABASE_URL")
print(f"Testing connection to: {database_url}")

try:
    engine = create_engine(database_url)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT NOW()"))
        print(f"✅ Connected! Server time: {result.fetchone()[0]}")
except Exception as e:
    print(f"❌ Connection failed: {e}")
