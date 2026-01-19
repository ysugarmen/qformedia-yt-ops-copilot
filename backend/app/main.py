from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import init_db, get_engine
from app.core.config import get_settings
from app.routes import rules, llm


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    engine = get_engine(settings.DATABASE_URL)
    init_db(engine)
    yield


app = FastAPI(title="YT Ops Copilot Backend", lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "chrome-extension://dlcnbbibellchcaoejijciahcaofdefd",
        "https://studio.youtube.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}


app.include_router(rules.router)
app.include_router(llm.router)

