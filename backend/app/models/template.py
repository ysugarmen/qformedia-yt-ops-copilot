from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class Template(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    name: str
    kind: str
    content: str

    created_at: datetime = Field(default_factory=datetime.utcnow)
    