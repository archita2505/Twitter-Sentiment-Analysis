"""
PulseSentiment Model Evaluation Script
Evaluates a trained model pipeline against any specified CSV dataset.
"""

import os
import sys
import json
import argparse
import pandas as pd
import numpy as np
import joblib
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report, confusion_matrix

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from ml.preprocessing import clean_tweet_text


def evaluate_dataset(
    model_path: str = "models/sentiment_model.joblib",
    data_path: str = "data/sample_sentiment_tweets.csv",
    text_col: str = "text",
    label_col: str = "sentiment"
):
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}. Train the model first.")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}")

    print(f"Loading pipeline from {model_path}...")
    pipeline = joblib.load(model_path)

    df = pd.read_csv(data_path)
    df = df.dropna(subset=[text_col, label_col])
    X = df[text_col].astype(str).values
    y_true = df[label_col].astype(str).str.strip().str.lower().values

    classes = list(pipeline.classes_)
    print(f"Model supported classes: {classes}")

    y_pred = pipeline.predict(X)

    acc = accuracy_score(y_true, y_pred)
    macro_f1 = f1_score(y_true, y_pred, average="macro", zero_division=0)
    report = classification_report(y_true, y_pred, labels=classes, zero_division=0)
    cm = confusion_matrix(y_true, y_pred, labels=classes)

    print("\n=== Evaluation Results ===")
    print(f"Total evaluated: {len(X)}")
    print(f"Accuracy: {acc:.4f}")
    print(f"Macro F1: {macro_f1:.4f}")
    print("\nClassification Report:\n", report)
    print("Confusion Matrix:\n", cm)

    return {"accuracy": acc, "macro_f1": macro_f1}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate PulseSentiment Model")
    parser.add_argument("--model", default="models/sentiment_model.joblib")
    parser.add_argument("--data", default="data/sample_sentiment_tweets.csv")
    parser.add_argument("--text-col", default="text")
    parser.add_argument("--label-col", default="sentiment")
    args = parser.parse_args()

    evaluate_dataset(args.model, args.data, args.text_col, args.label_col)
