from pydantic import BaseModel, Field
from typing import Literal, Optional, List


class VideoMetadata(BaseModel):
    platform: Literal["youtube-studio"] = "youtube-studio"
    videoId: str
    title: str
    description: str
    tags: List[str] = Field(default_factory=list)
    durationSeconds: Optional[int] = None


class LlmTask(str):
    pass


class ChatMessage(BaseModel):
    role: Literal["assistant", "user"]
    content: str


class ChatPayload(BaseModel):
    current_draft: str = Field(default=None, alias="currentDraft")
    messages: List[ChatMessage] = Field(default_factory=list)


class LlmSuggestRequest(BaseModel):
    task: Literal["rewrite_description", "chapters"]
    video: VideoMetadata
    styleProfile: Optional[str] = None
    chat: Optional[ChatPayload] = None


class Chapter(BaseModel):
    time: str  # "00:00"
    title: str


class LlmSuggestResponse(BaseModel):
    description: Optional[str] = None
    chapters: Optional[List[Chapter]] = None
    notes: List[str] = Field(default_factory=list)




