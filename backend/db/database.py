import os
from pymongo import MongoClient
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = "lambda_serverless"

try:
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    # Trigger connection check
    client.server_info()
    db = client[DB_NAME]
    logger.info(f"Connected to MongoDB: {DB_NAME}")
except Exception as e:
    logger.error(f"Could not connect to MongoDB: {e}")
    # Fallback/Mock for build time if needed, or raise
    db = None

def init_db():
    if db is not None:
        # Create indexes if they don't exist
        db.functions.create_index("id", unique=True)
        logger.info("MongoDB indexes initialized.")
