# PulseSentiment Model Artifacts

This directory contains trained serialized machine learning models and experimental metrics.

## Files
- `sentiment_model.joblib`: Complete fitted scikit-learn pipeline (word/character/negation TF-IDF + LogisticRegression)
- `model_metadata.json`: Held-out evaluation metrics, split sizes, class distributions, scikit-learn version, and hyperparameters

Retrain from the official TweetEval training and test splits with:

```bash
python data/download_tweet_eval.py
python ml/train.py --data data/tweet_eval/train.csv --test-data data/tweet_eval/test.csv
```

## Loading in Python
```python
import joblib

# Load pipeline
pipeline = joblib.load("models/sentiment_model.joblib")

# Run inference. Probabilities come from the fitted Logistic Regression model;
# they are estimates and are not guaranteed to be calibrated.
tweet = "Loving the new design! So fast and clean."
prediction = pipeline.predict([tweet])[0]
probabilities = pipeline.predict_proba([tweet])[0]
print("Predicted:", prediction)
for cls, prob in zip(pipeline.classes_, probabilities):
    print(f"  {cls}: {prob:.4f}")
```
