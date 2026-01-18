from functools import lru_cache
from fastapi import Depends, HTTPException
from openai import OpenAI

from app.core.config import Settings, get_settings

@lru_cache
def _client_cached(api_key: str) -> OpenAI:
    return OpenAI(api_key=api_key)

def get_openai_client(settings: Settings = Depends(get_settings)) -> OpenAI:
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=400, detail="OPENAI_API_KEY not set")
    return _client_cached(settings.OPENAI_API_KEY)

