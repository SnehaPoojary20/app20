from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.config import settings


app = FastAPI(
    title=settings.app_name,
    description="UK wind generation forecast and accuracy analytics API.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(
    router,
    prefix=settings.api_v1_prefix,
)


@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "application": settings.app_name,
    }
