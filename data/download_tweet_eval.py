"""Download the public TweetEval sentiment benchmark splits as CSV files."""

import csv
from pathlib import Path
from urllib.request import urlopen


DATA_DIR = Path(__file__).resolve().parent / "tweet_eval"
SOURCE_URL = "https://raw.githubusercontent.com/cardiffnlp/tweeteval/main/datasets/sentiment"
LABELS = {"0": "negative", "1": "neutral", "2": "positive"}
SPLITS = ("train", "val", "test")


def download_split(split: str) -> Path:
    text_url = f"{SOURCE_URL}/{split}_text.txt"
    label_url = f"{SOURCE_URL}/{split}_labels.txt"

    with urlopen(text_url, timeout=60) as response:
        texts = response.read().decode("utf-8").splitlines()
    with urlopen(label_url, timeout=60) as response:
        raw_labels = response.read().decode("utf-8").splitlines()

    if len(texts) != len(raw_labels):
        raise ValueError(
            f"{split} split has {len(texts)} texts but {len(raw_labels)} labels."
        )

    unknown_labels = sorted(set(raw_labels) - LABELS.keys())
    if unknown_labels:
        raise ValueError(f"Unexpected labels in {split} split: {unknown_labels}")

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    output_name = "validation" if split == "val" else split
    output_path = DATA_DIR / f"{output_name}.csv"
    with output_path.open("w", encoding="utf-8", newline="") as output_file:
        writer = csv.writer(output_file)
        writer.writerow(("text", "sentiment"))
        writer.writerows((text, LABELS[label]) for text, label in zip(texts, raw_labels))

    print(f"Saved {len(texts)} {split} examples to {output_path}")
    return output_path


if __name__ == "__main__":
    for split_name in SPLITS:
        download_split(split_name)
