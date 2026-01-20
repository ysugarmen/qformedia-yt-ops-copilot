from fastapi import APIRouter
from app.rules import RULES
from typing import Any

router = APIRouter(prefix="/rules", tags=["rules"])


@router.get("")
def list_rules()-> dict[str, list[Any]]:
    return {"rules": RULES}

