from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI

from app.core.config import Settings, get_settings
from app.deps import get_openai_client
from app.schemas import LlmSuggestRequest
from app.llm import suggest

router = APIRouter(
    prefix="/llm",
    tags=["llm"]
)


@router.post("/suggest")
def llm_suggest(
    req: LlmSuggestRequest,
    settings: Settings = Depends(get_settings),
    client: OpenAI = Depends(get_openai_client),
):
    try:
        print(req.video)
        return suggest(client=client, model=settings.OPENAI_MODEL, req=req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))