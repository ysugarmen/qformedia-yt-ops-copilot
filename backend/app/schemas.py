from pydantic import BaseModel, Field
from typing import Literal, Optional, List


class TemplateCreate(BaseModel):
    name: str
    kind: str
    content: str


class TemplateUpdate(BaseModel):
    name: str
    kind: str
    content: str


class VideoMetadata(BaseModel):
    platform: Literal["youtube-studio"] = "youtube-studio"
    videoId: str
    title: str
    description: str
    tags: List[str] = Field(default_factory=list)
    durationSeconds: Optional[int] = None


class LlmTask(str):
    pass


class LlmSuggestRequest(BaseModel):
    task: Literal["rewrite_description", "chapters", "pinned_comment"]
    video: VideoMetadata
    styleProfile: Optional[str] = None


class Chapter(BaseModel):
    time: str  # "00:00"
    title: str


class LlmSuggestResponse(BaseModel):
    description: Optional[str] = None
    chapters: Optional[List[Chapter]] = None
    pinned_comment: Optional[str] = None
    notes: List[str] = Field(default_factory=list)