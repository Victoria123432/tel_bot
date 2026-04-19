"""
Train a spaCy TextCategorizer (intent classifier) on top of the
uk_core_news_sm pipeline and save the result to ./trained_model/.

Run once before starting the NLP service:
    python train.py
"""

import random
import warnings
from pathlib import Path

import spacy
from spacy.training import Example

from training_data import TRAIN_DATA, INTENTS

MODEL_NAME = "uk_core_news_sm"
OUTPUT_DIR = Path(__file__).parent / "trained_model"
N_ITER = 30


def build_examples(nlp):
    examples = []
    for text, annotations in TRAIN_DATA:
        doc = nlp.make_doc(text)
        examples.append(Example.from_dict(doc, annotations))
    return examples


def train():
    print(f"Loading base model: {MODEL_NAME}")
    nlp = spacy.load(MODEL_NAME)

    # Add textcat_multilabel component
    if "textcat_multilabel" not in nlp.pipe_names:
        textcat = nlp.add_pipe("textcat_multilabel", last=True)
    else:
        textcat = nlp.get_pipe("textcat_multilabel")

    for intent in INTENTS:
        textcat.add_label(intent)

    # Freeze all pipes except the new textcat
    other_pipes = [p for p in nlp.pipe_names if p != "textcat_multilabel"]

    print(f"Training on {len(TRAIN_DATA)} examples for {N_ITER} iterations…")

    with nlp.select_pipes(disable=other_pipes):
        # Build initial examples for initialize()
        examples = build_examples(nlp)

        # Initialize (required in spaCy 3.x before training a new component)
        nlp.initialize(get_examples=lambda: examples)
        optimizer = nlp.resume_training()

        for i in range(N_ITER):
            random.shuffle(TRAIN_DATA)
            losses = {}
            batched = []
            for text, annotations in TRAIN_DATA:
                doc = nlp.make_doc(text)
                batched.append(Example.from_dict(doc, annotations))

            # Train in small batches
            for batch_start in range(0, len(batched), 8):
                batch = batched[batch_start:batch_start + 8]
                nlp.update(batch, sgd=optimizer, drop=0.2, losses=losses)

            if (i + 1) % 5 == 0:
                print(f"  Iter {i + 1:3d} — loss: {losses.get('textcat_multilabel', 0):.4f}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    nlp.to_disk(OUTPUT_DIR)
    print(f"Model saved to {OUTPUT_DIR}")


if __name__ == "__main__":
    warnings.filterwarnings("ignore")
    train()
