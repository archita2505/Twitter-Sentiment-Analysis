"""
PulseSentiment Backend Test Suite
Validates health checks, prediction accuracy, input validation, and history persistence.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database.db import init_db
from backend.services.model_service import model_service

init_db()
client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "PulseSentiment"
    assert data["status"] == "online"


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "model_loaded" in data
    assert "classes" in data
    assert isinstance(data["classes"], list)


def test_predict_single_positive():
    payload = {
        "tweet": "I absolutely love this new update! The performance is wonderful! :)",
        "save_to_history": True
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_sentiment" in data
    assert "confidence" in data
    assert "probabilities" in data
    assert "interpretation" in data
    assert data["predicted_sentiment"] in ["positive", "neutral", "negative"]
    assert 0.0 <= data["confidence"] <= 1.0


def test_predict_single_negative():
    payload = {
        "tweet": "This is the worst customer service ever. Flight delayed for 6 hours! Terrible! :(",
        "save_to_history": True
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_sentiment" in data
    assert data["confidence"] > 0


@pytest.mark.parametrize(
    ("tweet", "expected"),
    [
        ("This product is good.", "positive"),
        ("This product is not good.", "negative"),
        ("This product is not bad at all.", "positive"),
        ("I absolutely love this product!", "positive"),
        ("I hate this product.", "negative"),
        ("The company released a new product today.", "neutral"),
        (
            "Not bad at all! Honestly, one of the better products I've tried.",
            "positive",
        ),
    ],
)
def test_required_sentiment_examples(tweet, expected):
    response = client.post(
        "/api/predict",
        json={"tweet": tweet, "save_to_history": False},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["predicted_sentiment"] == expected
    assert data["is_demo_mode"] is False
    assert data["confidence"] == max(data["probabilities"].values())
    assert sum(data["probabilities"].values()) == pytest.approx(1.0, abs=0.001)


def test_prediction_is_unavailable_without_trained_model(monkeypatch):
    monkeypatch.setattr(model_service, "is_loaded", False)

    response = client.post(
        "/api/predict",
        json={"tweet": "This product is good.", "save_to_history": False},
    )

    assert response.status_code == 503


def test_predict_single_empty_validation():
    payload = {
        "tweet": "   ",
        "save_to_history": False
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 422


def test_predict_batch():
    payload = {
        "tweets": [
            {"id": "t1", "tweet": "Incredible work by the team, very happy with the results!"},
            {"id": "t2", "tweet": "Horrible bug, broke everything on production. Very upset."},
            {"id": "t3", "tweet": "The scheduled maintenance starts at 2 PM UTC."}
        ],
        "save_to_history": True
    }
    response = client.post("/api/predict/batch", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    assert len(data["results"]) == 3
    assert "sentiment_counts" in data


def test_get_metrics():
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    if data["status"] == "trained":
        assert "metrics" in data
        assert "accuracy" in data["metrics"]
        assert sum(data["training_class_distribution"].values()) == data["train_samples"]
        assert sum(data["test_class_distribution"].values()) == data["test_samples"]


def test_history_flow():
    # 1. Fetch history
    response = client.get("/api/history?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "items" in data
    assert isinstance(data["items"], list)
