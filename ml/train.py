"""Train and evaluate the PulseSentiment word/character/negation model."""

import os
import sys
import json
import argparse
from datetime import datetime, timezone
from typing import Optional
import pandas as pd
import numpy as np
import joblib
import sklearn

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)

# Ensure project root is in path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from ml.preprocessing import extract_negated_terms

DEFAULT_LABEL_MAP = {
    "0": "negative",
    "0.0": "negative",
    "-1": "negative",
    "-1.0": "negative",
    "2": "neutral",
    "2.0": "neutral",
    "4": "positive",
    "4.0": "positive",
}
SUPPORTED_LABELS = {"negative", "neutral", "positive"}


def _load_dataset(
    data_path: str,
    text_col: str,
    label_col: str,
    label_mapping: Optional[dict[str, str]],
) -> pd.DataFrame:
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}")

    df = pd.read_csv(data_path)
    if text_col not in df.columns or label_col not in df.columns:
        raise ValueError(
            f"Columns '{text_col}' and '{label_col}' must be present. "
            f"Found: {list(df.columns)}"
        )

    df = df.dropna(subset=[text_col, label_col]).copy()
    df[text_col] = df[text_col].astype(str).str.strip()
    df[label_col] = df[label_col].astype(str).str.strip().str.lower()
    df = df[(df[text_col] != "") & (df[label_col] != "")]

    explicit_mapping = {
        str(key).strip().lower(): str(value).strip().lower()
        for key, value in (label_mapping or {}).items()
    }
    label_map = {**DEFAULT_LABEL_MAP, **explicit_mapping}
    df[label_col] = df[label_col].map(lambda label: label_map.get(label, label))
    df = df.drop_duplicates(subset=[text_col]).copy()

    classes = set(df[label_col])
    unsupported = classes - SUPPORTED_LABELS
    if unsupported:
        raise ValueError(
            f"Unsupported sentiment labels: {sorted(unsupported)}. "
            "Use negative/neutral/positive labels or pass an explicit --map-labels "
            "mapping, for example "
            '\'{"0":"negative","1":"neutral","2":"positive"}\'.'
        )
    if len(classes) < 2:
        raise ValueError(f"Dataset must have at least 2 sentiment classes. Found: {classes}")

    return df


def train_model(
    data_path: str = "data/sample_sentiment_tweets.csv",
    text_col: str = "text",
    label_col: str = "sentiment",
    output_dir: str = "models",
    test_size: float = 0.20,
    random_state: int = 42,
    max_features: int = 60000,
    c_param: float = 2.0,
    ngram_range: tuple[int, int] = (1, 2),
    test_data_path: Optional[str] = None,
    label_mapping: Optional[dict[str, str]] = None,
):
    """
    Trains a TF-IDF Logistic Regression pipeline and evaluates it on held-out data.
    """
    print(f"=== PulseSentiment Model Training ===")
    print(f"Dataset path: {data_path}")
    print(f"Text column: {text_col} | Label column: {label_col}")

    train_df = _load_dataset(data_path, text_col, label_col, label_mapping)
    if test_data_path:
        test_df = _load_dataset(test_data_path, text_col, label_col, label_mapping)
        overlap = set(train_df[text_col]).intersection(test_df[text_col])
        if overlap:
            raise ValueError(
                f"Training and test datasets contain {len(overlap)} identical texts. "
                "Remove overlapping examples to keep the evaluation held out."
            )
        X_train = train_df[text_col].to_numpy()
        y_train = train_df[label_col].to_numpy()
        X_test = test_df[text_col].to_numpy()
        y_test = test_df[label_col].to_numpy()
        evaluation_dataset_name = os.path.basename(test_data_path)
        all_labels = pd.concat([train_df[label_col], test_df[label_col]])
    else:
        X = train_df[text_col].to_numpy()
        y = train_df[label_col].to_numpy()
        if not 0 < test_size < 1:
            raise ValueError("test_size must be greater than 0 and less than 1.")
        class_counts = train_df[label_col].value_counts()
        stratify_target = train_df[label_col] if class_counts.min() >= 2 else None
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=test_size,
            random_state=random_state,
            stratify=stratify_target,
        )
        evaluation_dataset_name = os.path.basename(data_path)
        all_labels = train_df[label_col]

    classes = sorted(set(y_train))
    if not set(y_test).issubset(classes):
        raise ValueError("The held-out test set contains labels missing from the training set.")
    if len(classes) < 2:
        raise ValueError(f"Training data must contain at least 2 classes. Found: {classes}")

    class_counts = all_labels.value_counts().sort_index().to_dict()
    training_class_counts = pd.Series(y_train).value_counts().sort_index().to_dict()
    test_class_counts = pd.Series(y_test).value_counts().sort_index().to_dict()
    print(f"Training examples: {len(X_train)} | Held-out test examples: {len(X_test)}")
    print(f"Class distribution (all supplied splits): {class_counts}")

    # Word n-grams learn sentiment phrases, character n-grams cover Twitter
    # spelling, and a separate branch gives short negation-scope features weight.
    pipeline = Pipeline([
        ('features', FeatureUnion([
            ('word', TfidfVectorizer(
                ngram_range=ngram_range,
                max_features=max_features,
                min_df=2,
                sublinear_tf=True,
            )),
            ('character', TfidfVectorizer(
                analyzer='char',
                ngram_range=(3, 5),
                max_features=max_features,
                min_df=2,
                sublinear_tf=True,
            )),
            ('negation', TfidfVectorizer(
                preprocessor=extract_negated_terms,
                token_pattern=r"(?u)\b\w+\b",
                lowercase=False,
                min_df=1,
            )),
        ], transformer_weights={"negation": 8.0})),
        ('clf', LogisticRegression(
            C=c_param,
            max_iter=1000,
            class_weight='balanced',
            random_state=random_state,
            solver='lbfgs'
        ))
    ])

    print("Fitting word/character/negation TF-IDF and Logistic Regression on training data...")
    pipeline.fit(X_train, y_train)

    print("Evaluating on held-out test data...")
    y_pred = pipeline.predict(X_test)

    acc = float(accuracy_score(y_test, y_pred))
    macro_p = float(precision_score(y_test, y_pred, average='macro', zero_division=0))
    macro_r = float(recall_score(y_test, y_pred, average='macro', zero_division=0))
    macro_f1 = float(f1_score(y_test, y_pred, average='macro', zero_division=0))

    per_class_report = classification_report(y_test, y_pred, labels=classes, output_dict=True, zero_division=0)
    conf_mat = confusion_matrix(y_test, y_pred, labels=classes).tolist()

    # Per-class metrics formatting
    per_class_metrics = {}
    for c in classes:
        if c in per_class_report:
            per_class_metrics[c] = {
                "precision": round(float(per_class_report[c]["precision"]), 4),
                "recall": round(float(per_class_report[c]["recall"]), 4),
                "f1_score": round(float(per_class_report[c]["f1-score"]), 4),
                "support": int(per_class_report[c]["support"])
            }

    print(f"--- Evaluation Metrics on Test Set ---")
    print(f"Accuracy:       {acc:.4f} ({acc*100:.2f}%)")
    print(f"Macro Precision:{macro_p:.4f}")
    print(f"Macro Recall:   {macro_r:.4f}")
    print(f"Macro F1-Score: {macro_f1:.4f}")
    print(f"Confusion Matrix ({classes}):\n{np.array(conf_mat)}")

    # 7. Model Metadata
    now_utc = datetime.now(timezone.utc).isoformat()
    metadata = {
        "model_name": "PulseSentiment-WordCharNegation-LogReg",
        "model_version": "2.0.0",
        "algorithm": "Logistic Regression + word/character/negation TF-IDF",
        "training_timestamp": now_utc,
        "dataset_name": os.path.basename(data_path),
        "evaluation_dataset_name": evaluation_dataset_name,
        "total_dataset_rows": len(all_labels),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "classes": classes,
        "num_classes": len(classes),
        "class_distribution": class_counts,
        "training_class_distribution": training_class_counts,
        "test_class_distribution": test_class_counts,
        "scikit_learn_version": sklearn.__version__,
        "metrics": {
            "accuracy": round(acc, 4),
            "macro_precision": round(macro_p, 4),
            "macro_recall": round(macro_r, 4),
            "macro_f1": round(macro_f1, 4),
            "per_class": per_class_metrics,
            "confusion_matrix": {
                "labels": classes,
                "matrix": conf_mat
            }
        },
        "hyperparameters": {
            "word_ngram_range": list(ngram_range),
            "character_ngram_range": [3, 5],
            "negation_scope_words": 3,
            "negation_feature_weight": 8.0,
            "max_features": max_features,
            "min_df": 2,
            "sublinear_tf": True,
            "C": c_param,
            "random_state": random_state
        }
    }

    # 8. Persist artifacts
    os.makedirs(output_dir, exist_ok=True)
    model_path = os.path.join(output_dir, "sentiment_model.joblib")
    metadata_path = os.path.join(output_dir, "model_metadata.json")

    joblib.dump(pipeline, model_path)
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"Saved model pipeline to: {model_path}")
    print(f"Saved model metadata to: {metadata_path}")
    print("Training successfully completed.")

    return metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train PulseSentiment model")
    parser.add_argument("--data", default="data/sample_sentiment_tweets.csv", help="Path to labeled CSV")
    parser.add_argument("--text-col", default="text", help="Text column name")
    parser.add_argument("--label-col", default="sentiment", help="Sentiment label column name")
    parser.add_argument("--output-dir", default="models", help="Output directory for model and metrics")
    parser.add_argument("--test-size", type=float, default=0.25, help="Test split ratio")
    parser.add_argument("--test-data", default=None, help="Optional separate held-out CSV dataset")
    parser.add_argument(
        "--map-labels",
        default=None,
        help='Optional JSON mapping, e.g. \'{"0":"negative","1":"neutral","2":"positive"}\'',
    )
    args = parser.parse_args()

    train_model(
        data_path=args.data,
        text_col=args.text_col,
        label_col=args.label_col,
        output_dir=args.output_dir,
        test_size=args.test_size,
        test_data_path=args.test_data,
        label_mapping=json.loads(args.map_labels) if args.map_labels else None,
    )
