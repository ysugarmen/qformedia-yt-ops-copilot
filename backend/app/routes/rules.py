from fastapi import APIRouter
from app.rules import RULES

router = APIRouter(prefix="/rules", tags=["rules"])


@router.get("")
def list_rules():
    return {"rules": RULES}

