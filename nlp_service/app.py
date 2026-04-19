"""
FastAPI NLP microservice.

Endpoint:
  POST /analyze   — analyze text, return intent + NER entities
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

import model as nlp_model

app = FastAPI(title="NLP Service", version="1.0.0")

# Pre-load model at startup
nlp_model._load()


class AnalyzeRequest(BaseModel):
    text: str


class EntityItem(BaseModel):
    text: str
    label: str


class AnalyzeResponse(BaseModel):
    intent: str
    city: str | None
    entities: list[EntityItem]


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Field 'text' must not be empty.")

    result = nlp_model.analyze(req.text.strip())
    return result
