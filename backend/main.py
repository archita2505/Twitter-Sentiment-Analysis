"""
PulseSentiment Backend Entrypoint
FastAPI application with CORS, SQLite persistence, and machine learning inference.
"""

import os
import sys
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Ensure root is in python path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.database.db import init_db
from backend.services.model_service import model_service
from backend.api.routes import router as api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("pulsesentiment.app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize SQLite database schema
    logger.info("Initializing PulseSentiment database...")
    init_db()
    # Ensure model is loaded
    model_service.load_model()
    logger.info("PulseSentiment backend initialized successfully.")
    yield
    # Shutdown
    logger.info("PulseSentiment backend shutting down...")


app = FastAPI(
    title="PulseSentiment API",
    description="NLP-based Twitter/X Sentiment Analysis Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in ALLOWED_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info("Request: %s %s", request.method, request.url.path)
    response = await call_next(request)
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled server exception: %s", str(exc))
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error occurred.", "error": str(exc)}
    )


# Register API endpoints
app.include_router(api_router, prefix="/api")


@app.get("/")
def root():
    return {
        "app": "PulseSentiment",
        "status": "online",
        "docs": "/docs",
        "health": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.main:app", host="127.0.0.1", port=port, reload=True)
