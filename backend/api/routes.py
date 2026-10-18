"""
PulseSentiment FastAPI Route Handlers
Implements clean REST API endpoints for sentiment inference, analytics, and history.
"""

import json
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form, status
import pandas as pd
import io

from backend.schemas.sentiment import (
    TweetPredictRequest,
    TweetPredictResponse,
    BatchPredictRequest,
    BatchPredictResponse,
    HistoryResponse,
    HistoryRecord,
    ModelMetricsResponse,
    HealthResponse
)
from backend.services.model_service import model_service
from backend.database.db import (
    save_analysis,
    save_batch_analyses,
    get_history,
    get_history_count,
    clear_history
)
from ml.train import train_model

logger = logging.getLogger("pulsesentiment.routes")
router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["Health"])
def get_health():
    """Reports API status and model readiness."""
    status_info = model_service.get_status()
    return HealthResponse(
        status="healthy",
        service="PulseSentiment API",
        model_loaded=status_info["model_loaded"],
        model_mode=status_info["model_mode"],
        classes=status_info["classes"],
        version=status_info["version"]
    )


@router.post("/predict", response_model=TweetPredictResponse, tags=["Prediction"])
def predict_tweet(payload: TweetPredictRequest):
    """
    Accepts a single tweet, performs NLP sentiment inference,
    and returns predicted class and probabilities.
    """
    text = payload.tweet.strip()
    if not text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Tweet text cannot be empty or purely whitespace."
        )
    if not model_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The trained sentiment model is unavailable. Train or restore a model before predicting.",
        )

    try:
        prediction = model_service.predict_single(text)

        # Persist to SQLite history if requested
        if payload.save_to_history:
            try:
                save_analysis(
                    tweet_text=text,
                    sentiment=prediction["predicted_sentiment"],
                    confidence=prediction["confidence"],
                    probabilities=json.dumps(prediction["probabilities"]),
                    source="single"
                )
            except Exception as e:
                logger.error("Failed to save prediction to history: %s", str(e))

        return TweetPredictResponse(**prediction)
    except Exception as e:
        logger.exception("Inference error: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference failed: {str(e)}"
        )


@router.post("/predict/batch", response_model=BatchPredictResponse, tags=["Prediction"])
def predict_batch(payload: BatchPredictRequest):
    """
    Accepts a list of tweets (up to 500) and returns predicted sentiment for each.
    """
    if len(payload.tweets) > 500:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Batch limit exceeded. Maximum 500 tweets per batch request."
        )
    if not model_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The trained sentiment model is unavailable. Train or restore a model before predicting.",
        )

    items = [{"id": it.id, "tweet": it.tweet.strip()} for it in payload.tweets if it.tweet.strip()]
    if not items:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No valid tweets provided in batch."
        )

    try:
        result = model_service.predict_batch(items)

        if payload.save_to_history:
            history_rows = [
                {
                    "tweet_text": r["tweet"],
                    "sentiment": r["predicted_sentiment"],
                    "confidence": r["confidence"],
                    "probabilities": json.dumps(r["probabilities"]),
                    "source": "batch"
                }
                for r in result["results"]
            ]
            try:
                save_batch_analyses(history_rows)
            except Exception as e:
                logger.error("Failed to save batch history: %s", str(e))

        return BatchPredictResponse(**result)
    except Exception as e:
        logger.exception("Batch prediction error: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch prediction failed: {str(e)}"
        )


@router.get("/metrics", response_model=ModelMetricsResponse, tags=["Model"])
def get_model_metrics():
    """
    Returns actual evaluation metrics, classification report, and confusion matrix.
    """
    metrics_data = model_service.get_metrics()
    return ModelMetricsResponse(**metrics_data)


@router.get("/history", response_model=HistoryResponse, tags=["History"])
def get_analysis_history(
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    sentiment: Optional[str] = Query(default=None)
):
    """
    Retrieves persisted analysis history records with pagination and filtering.
    """
    records = get_history(limit=limit, offset=offset, sentiment=sentiment)
    total = get_history_count(sentiment=sentiment)

    parsed_items = []
    for r in records:
        try:
            probs = json.loads(r["probabilities"])
        except Exception:
            probs = {}
        parsed_items.append(
            HistoryRecord(
                id=r["id"],
                tweet_text=r["tweet_text"],
                sentiment=r["sentiment"],
                confidence=r["confidence"],
                probabilities=probs,
                created_at=r["created_at"],
                source=r["source"]
            )
        )

    return HistoryResponse(
        total=total,
        items=parsed_items,
        limit=limit,
        offset=offset
    )


@router.delete("/history", tags=["History"])
def delete_analysis_history():
    """Clears all persisted analysis history records."""
    count = clear_history()
    return {
        "status": "success",
        "message": f"Successfully cleared {count} analysis history records.",
        "records_removed": count
    }


@router.get("/dataset/sample", tags=["Dataset"])
def get_sample_dataset():
    """Returns sample dataset tweets with actual labels for dataset exploration."""
    import os
    sample_path = os.path.join("data", "sample_sentiment_tweets.csv")
    if os.path.exists(sample_path):
        df = pd.read_csv(sample_path)
        return {
            "total_rows": len(df),
            "columns": list(df.columns),
            "class_distribution": df["sentiment"].value_counts().to_dict(),
            "sample_rows": df.head(60).to_dict(orient="records")
        }
    return {"total_rows": 0, "columns": [], "sample_rows": []}


@router.post("/dataset/upload-preview", tags=["Dataset"])
async def upload_csv_preview(file: UploadFile = File(...)):
    """
    Validates an uploaded CSV file, inspects columns, and returns a schema preview.
    Max file size: 10MB.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV file.")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 10 MB.")

    try:
        df = pd.read_csv(io.BytesIO(contents))
        if df.empty:
            raise HTTPException(status_code=400, detail="Uploaded CSV file is empty.")

        row_count = len(df)
        cols = list(df.columns)
        preview_rows = df.head(10).fillna("").to_dict(orient="records")

        return {
            "filename": file.filename,
            "row_count": row_count,
            "column_count": len(cols),
            "columns": cols,
            "preview_rows": preview_rows
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")


@router.post("/train", tags=["Model"])
def train_pipeline(
    data_path: str = Form(default="data/sample_sentiment_tweets.csv"),
    text_col: str = Form(default="text"),
    label_col: str = Form(default="sentiment"),
    test_size: float = Form(default=0.25),
    test_data_path: Optional[str] = Form(default=None),
):
    """
    Explicitly triggers the model training pipeline.
    """
    try:
        metadata = train_model(
            data_path=data_path,
            text_col=text_col,
            label_col=label_col,
            test_size=test_size,
            test_data_path=test_data_path,
        )
        # Reload model into service
        model_service.load_model()
        return {
            "status": "success",
            "message": "Model trained and reloaded successfully.",
            "metadata": metadata
        }
    except Exception as e:
        logger.exception("Training error: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Model training failed: {str(e)}")
