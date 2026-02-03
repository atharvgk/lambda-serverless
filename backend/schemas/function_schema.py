from pydantic import BaseModel

class FunctionCreate(BaseModel):
    name: str
    language: str
    timeout: int
    code: str

class FunctionUpdate(BaseModel):
    name: str | None = None
    language: str | None = None
    code: str | None = None
    timeout: int | None = None
