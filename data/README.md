# PulseSentiment Datasets Guide

PulseSentiment supports labeled CSV datasets for sentiment analysis training, evaluation, and batch inference.

## 1. Default Sample Dataset
- **Location:** `data/sample_sentiment_tweets.csv`
- **Size:** 600 generated examples (200 for each class)
- **Use:** Dataset exploration/demo only; repeated templates make it unsuitable for trustworthy model evaluation.
- **Classes:** `positive`, `negative`, `neutral` (balanced 3-class distribution)
- **Columns:**
  - `tweet_id`: Unique identifier
  - `text`: Tweet text content
  - `sentiment`: Target label (`positive`, `negative`, `neutral`)
  - `timestamp`: ISO-8601 creation timestamp

## 2. Supported Datasets & Formats

### A. Sentiment140 (2-Class / Binary Sentiment)
Sentiment140 contains 1.6 million tweets extracted using Twitter API.
- Standard columns: `target` (0 = negative, 4 = positive), `id`, `date`, `flag`, `user`, `text`.
- When training on Sentiment140:
  ```bash
  python ml/train.py --data data/sentiment140.csv --text-col text --label-col target --map-labels '{"0": "negative", "4": "positive"}'
  ```
- *Note:* The model will train in **binary mode** (Positive / Negative) without fabricating neutral labels.

### B. Twitter US Airline Sentiment (3-Class)
- Classes: `positive`, `negative`, `neutral`.
- Columns: `airline_sentiment`, `text`, etc.
- When training:
  ```bash
  python ml/train.py --data data/airline_sentiment.csv --text-col text --label-col airline_sentiment
  ```

### C. Custom CSV Datasets
Any CSV file can be used as long as it has:
1. A text column containing tweets/posts.
2. (For training) A label column containing sentiment annotations (`positive`, `negative`, `neutral` or binary `positive`/`negative`).

## 3. Preprocessing Highlights
- Contraction expansion (`don't` -> `do not`, preserving negation).
- Hashtag text extraction (`#FastAPI` -> `FastAPI`).
- Mention masking (`@username` stripped to prevent bias).
- Emoticon detection (mapped to sentiment tokens).
- HTML entity decoding (`&amp;` -> `&`).
- URL removal.

## 4. TweetEval Sentiment Benchmark

For a larger, independently split three-class dataset, run:

```bash
python data/download_tweet_eval.py
```

This downloads the official TweetEval sentiment `train`, `validation`, and `test`
splits from [CardiffNLP/TweetEval](https://github.com/cardiffnlp/tweeteval) into
`data/tweet_eval/`. Numeric labels are mapped using the benchmark definition:
`0 = negative`, `1 = neutral`, and `2 = positive`. The original sample CSV above
is not overwritten. The dataset card reports its license as unknown, so check
the source terms before redistributing the downloaded data.
