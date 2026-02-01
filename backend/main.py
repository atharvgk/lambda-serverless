from fastapi import FastAPI
from backend.api.routes import router
from backend.db.database import init_db

app = FastAPI(title="Lambda Serverless")

@app.get("/")
def read_root():
    return {"message": "Lambda Serverless Platform is running", "status": "active"}

init_db()
app.include_router(router)
