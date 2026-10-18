"""
PulseSentiment Pydantic Schemas
Defines request and response data structures for FastAPI endpoints.
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class TweetPredictRequest(BaseModel):
    tweet: str = Field(..., min_length=1, max_length=1000, description="The tweet text to analyze")
    save_to_history: bool = Field(default=True, description="Whether to persist this analysis in SQLite history")


class SentimentProbability(BaseModel):
    sentiment: str
    probability: float


class TweetPredictResponse(BaseModel):
    tweet: str
    predicted_sentiment: str
    confidence: float
    probabilities: Dict[str, float]
    probabilities_list: List[SentimentProbability]
    interpretation: str
    timestamp: str
    model_version: str
    is_demo_mode: bool = False


class BatchPredictItem(BaseModel):
    id: Optional[str] = None
    tweet: str = Field(..., min_length=1, max_length=1000)


class BatchPredictRequest(BaseModel):
    tweets: List[BatchPredictItem] = Field(..., min_length=1, max_length=500, description="List of tweets to predict (max 500)")
    save_to_history: bool = Field(default=True, description="Whether to persist results in history")


class BatchPredictResult(BaseModel):
    id: Optional[str]
    tweet: str
    predicted_sentiment: str
    confidence: float
    probabilities: Dict[str, float]


class BatchPredictResponse(BaseModel):
    total: int
    sentiment_counts: Dict[str, int]
    results: List[BatchPredictResult]
    model_version: str
    is_demo_mode: bool = False


class HistoryRecord(BaseModel):
    id: int
    tweet_text: str
    sentiment: str
    confidence: float
    probabilities: Dict[str, float]
    created_at: str
    source: str


class HistoryResponse(BaseModel):
    total: int
    items: List[HistoryRecord]
    limit: int
    offset: int


class ModelMetricsResponse(BaseModel):
    status: str
    model_name: Optional[str] = None
    model_version: Optional[str] = None
    algorithm: Optional[str] = None
    training_timestamp: Optional[str] = None
    dataset_name: Optional[str] = None
    evaluation_dataset_name: Optional[str] = None
    total_dataset_rows: Optional[int] = None
    train_samples: Optional[int] = None
    test_samples: Optional[int] = None
    classes: Optional[List[str]] = None
    num_classes: Optional[int] = None
    class_distribution: Optional[Dict[str, int]] = None
    training_class_distribution: Optional[Dict[str, int]] = None
    test_class_distribution: Optional[Dict[str, int]] = None
    scikit_learn_version: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None
    hyperparameters: Optional[Dict[str, Any]] = None
    message: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    service: str
    model_loaded: bool
    model_mode: str
    classes: List[str]
    version: str
