import pytest
import requests
import numpy as np
from numpy.linalg import norm

API_URL = "http://localhost:3001/similarity"


def test_sentence_similarity(text1, text2):
    # Get similarity from your API
    res = requests.post(API_URL, json={"text1": text1, "text2": text2})

    assert res.status_code == 200, f"API error: {res.json()}"
    similarity = res.json().get("similarity")

    print(f"Similarity between:\n- '{text1}'\n- '{text2}'\n= {similarity:.3f}")

    # You can modify the threshold based on what you define as "similar"
    assert 0.0 <= similarity <= 1.0  # Cosine similarity should be between 0 and 1

sentence_pairs = [
    ("The sun rises in the east every morning", "Sunlight comes from the east at dawn"),
    ("Artificial intelligence is transforming technology", "Machines are becoming smarter every year"),
    ("The sky is blue due to the scattering of light", "Why is the sky blue during the day"),
    ("Bitcoin is a decentralized cryptocurrency", "What makes Bitcoin different from regular currencies"),
    ("The Earth revolves around the Sun", "The Sun is at the center of our solar system"),
    ("Reading books helps to improve vocabulary", "Books are essential for expanding one's vocabulary"),
    ("I enjoy listening to classical music in the evening", "Classical music is soothing to listen to at night"),
    ("The Eiffel Tower is located in Paris, France", "Paris is known for the Eiffel Tower"),
    ("Shakespeare wrote many famous plays like Hamlet", "Hamlet is one of Shakespeare's most well-known works"),
    ("The stock market is volatile and can change rapidly", "Stock prices fluctuate unpredictably")
]

for sentence in sentence_pairs:
    test_sentence_similarity(*sentence)