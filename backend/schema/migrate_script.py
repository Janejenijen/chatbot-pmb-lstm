from sqlalchemy import text
from config.database import engine

def migrate():
    with engine.connect() as conn:
        try:
            # Check if column exists
            print("Checking if column 'is_new_data' exists...")
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='chat_logs' AND column_name='is_new_data'"))
            if result.fetchone():
                print("Column 'is_new_data' already exists.")
            else:
                print("Adding column 'is_new_data' to 'chat_logs'...")
                conn.execute(text("ALTER TABLE chat_logs ADD COLUMN is_new_data BOOLEAN DEFAULT TRUE"))
                conn.commit()
                print("Column added successfully.")
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
