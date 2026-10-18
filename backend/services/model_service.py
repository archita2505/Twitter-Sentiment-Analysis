"""Load the trained sentiment pipeline and return its inference outputs."""

import os
import sys
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import joblib

# Ensure project root is in sys.path so unpickling ml.preprocessing works
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
ROOT_DIR = os.path.dirname(BACKEND_DIR)
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

logger = logging.getLogger("pulsesentiment.model")

MODEL_PATH = os.path.join(ROOT_DIR, "models", "sentiment_model.joblib")
METADATA_PATH = os.path.join(ROOT_DIR, "models", "model_metadata.json")


class ModelService:
    def __init__(self):
        self.pipeline = None
        self.metadata: Optional[Dict[str, Any]] = None
        self.classes: List[str] = []
        self.is_loaded = False
        self.load_model()

    def load_model(self):
        """Loads trained pipeline and metadata from disk."""
        if os.path.exists(MODEL_PATH):
            try:
                self.pipeline = joblib.load(MODEL_PATH)
                self.classes = list(self.pipeline.classes_)
                self.is_loaded = True
                logger.info("Loaded sentiment model from %s. Classes: %s", MODEL_PATH, self.classes)
            except Exception as e:
                logger.error("Failed to load model from %s: %s", MODEL_PATH, str(e))
                self.pipeline = None
                self.is_loaded = False
        else:
            logger.warning("Model file not found at %s. Prediction service is unavailable.", MODEL_PATH)
            self.pipeline = None
            self.is_loaded = False

        if os.path.exists(METADATA_PATH):
            try:
                with open(METADATA_PATH, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
            except Exception as e:
                logger.error("Failed to load metadata: %s", str(e))
                self.metadata = None
        else:
            self.metadata = None

    def get_status(self) -> Dict[str, Any]:
        return {
            "model_loaded": self.is_loaded,
            "model_mode": "trained_model" if self.is_loaded else "not_trained",
            "classes": self.classes if self.is_loaded else ["negative", "neutral", "positive"],
            "version": self.metadata.get("model_version", "unknown") if self.metadata else "1.0.0"
        }

    def get_metrics(self) -> Dict[str, Any]:
        if self.metadata:
            return {
                "status": "trained",
                **self.metadata
            }
        return {
            "status": "not_trained",
            "message": "No model has been trained yet. Please configure a dataset and run the training pipeline."
        }

    def _interpret(self, sentiment: str, confidence: float) -> str:
        pct = int(confidence * 100)
        if sentiment == "positive":
            if confidence >= 0.75:
                return f"Strongly positive sentiment detected with {pct}% model confidence. Shows enthusiasm, satisfaction, or praise."
            return f"Mildly positive tone ({pct}% confidence). Expresses general approval or pleasant sentiment."
        elif sentiment == "negative":
            if confidence >= 0.75:
                return f"Markedly critical or dissatisfied tone detected ({pct}% confidence). Reflects complaint, frustration, or issue."
            return f"Mildly negative tone ({pct}% confidence). Suggests minor disappointment or unfavorable remark."
        elif sentiment == "neutral":
            return f"Factual, objective, or informational statement ({pct}% confidence) without significant emotional polarity."
        return f"Predicted {sentiment} with {pct}% confidence."

    def predict_single(self, text: str) -> Dict[str, Any]:
        """Runs prediction on a single tweet text."""
        if not self.is_loaded or self.pipeline is None:
            raise RuntimeError("The trained sentiment model is not loaded.")

        now_iso = datetime.now(timezone.utc).isoformat()
        pred_class = str(self.pipeline.predict([text])[0])
        probs_array = self.pipeline.predict_proba([text])[0]

        probabilities: Dict[str, float] = {}
        for cls_name, prob in zip(self.pipeline.classes_, probs_array):
            probabilities[str(cls_name)] = round(float(prob), 4)

        top_prob = round(float(probabilities.get(pred_class, max(probs_array))), 4)
        interpretation = self._interpret(pred_class, top_prob)
        prob_list = [
            {"sentiment": key, "probability": value}
            for key, value in probabilities.items()
        ]

        return {
            "tweet": text,
            "predicted_sentiment": pred_class,
            "confidence": top_prob,
            "probabilities": probabilities,
            "probabilities_list": prob_list,
            "interpretation": interpretation,
            "timestamp": now_iso,
            "model_version": self.metadata.get("model_version", "1.0.0") if self.metadata else "1.0.0",
            "is_demo_mode": False,
        }

    def predict_batch(self, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Runs predictions on a batch of tweets."""
        if not self.is_loaded or self.pipeline is None:
            raise RuntimeError("The trained sentiment model is not loaded.")

        results = []
        counts: Dict[str, int] = {}

        texts = [it["tweet"] for it in items]
        preds = self.pipeline.predict(texts)
        probs = self.pipeline.predict_proba(texts)
        classes = [str(c) for c in self.pipeline.classes_]

        for i, item in enumerate(items):
            pred_class = str(preds[i])
            row_probs = {
                classes[j]: round(float(probs[i][j]), 4)
                for j in range(len(classes))
            }
            top_prob = round(float(row_probs.get(pred_class, max(probs[i]))), 4)

            counts[pred_class] = counts.get(pred_class, 0) + 1
            results.append({
                "id": item.get("id"),
                "tweet": item["tweet"],
                "predicted_sentiment": pred_class,
                "confidence": top_prob,
                "probabilities": row_probs,
            })

        return {
            "total": len(items),
            "sentiment_counts": counts,
            "results": results,
            "model_version": self.metadata.get("model_version", "1.0.0") if self.metadata else "1.0.0",
            "is_demo_mode": False,
        }


model_service = ModelService()
