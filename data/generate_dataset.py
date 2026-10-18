"""
Generates a representative, high-quality sample Twitter sentiment dataset
with Positive, Negative, and Neutral classes.
Includes realistic tweet text, hashtags, mentions, emoticons, and ISO timestamps.
"""
import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
from generate_rich_dataset import generate

if __name__ == "__main__":
    generate()
