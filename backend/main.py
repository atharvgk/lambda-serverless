from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.api.routes import router
from backend.db.database import init_db

app = FastAPI(title="Lambda Serverless")

app.mount("/static", StaticFiles(directory="backend/static"), name="static")

@app.get("/")
def read_root():
    return FileResponse("backend/static/index.html")

init_db()
app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
