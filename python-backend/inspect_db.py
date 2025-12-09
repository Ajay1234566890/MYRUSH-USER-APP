from sqlalchemy import create_engine, inspect
import os
from dotenv import load_dotenv

load_dotenv()

database_url = os.getenv("DATABASE_URL")
engine = create_engine(database_url)
inspector = inspect(engine)

def print_table_info(table_name):
    if inspector.has_table(table_name):
        print(f"\nTable: {table_name}")
        columns = inspector.get_columns(table_name)
        for column in columns:
            print(f"  - {column['name']} ({column['type']})")
    else:
        print(f"\nTable {table_name} does not exist!")

print("Checking tables...")
print_table_info("users")
print_table_info("profiles")
print_table_info("user_profiles")
print_table_info("booking")
print_table_info("adminvenues")
print_table_info("otp_verifications")
print_table_info("admin_cities")
print_table_info("admin_game_types")
