from pydantic import BaseModel
from datetime import datetime

class ChatInput(BaseModel):
    message: str

class Message(BaseModel):
    id: int
    content: str
    is_user: bool
    timestamp: datetime

    class Config:
        from_attributes = True