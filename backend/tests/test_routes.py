from fastapi.testclient import TestClient
from ..main import app
from ..db import database, models 
import mongomock

# Mock the database connection
mock_client = mongomock.MongoClient()
# Patch BOTH the database module (for future imports) AND the models module (which already imported db)
database.db = mock_client.lambda_serverless
models.db = mock_client.lambda_serverless

# Ensure counters collection exists for get_next_sequence_value
models.db.counters.insert_one({"_id": "function_id", "sequence_value": 0})

client = TestClient(app)

def test_list_functions():
    response = client.get("/functions/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_upload_function():
    test_function = {
        "name": "test_function",
        "language": "python",
        "timeout": 5,
        "code": "print('Hello, World!')"
    }
    response = client.post("/functions/", json=test_function)
    assert response.status_code == 200
    assert "function_id" in response.json()

def test_run_function():
    # First upload a function
    test_function = {
        "name": "test_run",
        "language": "python",
        "timeout": 5,
        "code": "print('Hello, World!')"
    }
    upload_response = client.post("/functions/", json=test_function)
    function_id = upload_response.json()["function_id"]
    
    # Then try to run it
    response = client.post(f"/functions/{function_id}/run", json={"use_gvisor": False})
    assert response.status_code == 200
    assert "result" in response.json() 