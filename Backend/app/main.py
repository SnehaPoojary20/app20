from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

app = FastAPI(
title=settings.app_name,
description=(
"Analyze UK wind generation forecasts against "
"actual generation data from Elexon BMRS."
),
version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins= settings.frontend_origins,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["Health"])
async def health_check():
    """Check whether the backend API is running."""

    return {
           "status": "healthy",
           "application": settings.app_name,
    }