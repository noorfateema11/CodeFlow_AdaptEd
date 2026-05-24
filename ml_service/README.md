# adaptEd ML Microservice — Pillar 3

## What this does
Real trained ML models (scikit-learn), NOT an LLM wrapper:

- **ReadabilityClassifier** — Multinomial Naive Bayes trained on labeled sentences → classifies each sentence as simple/moderate/complex
- **ContentRecommender** — TF-IDF + cosine similarity → recommends content adaptation strategy per disability type  
- **KeywordExtractor** — TF-IDF vectorizer → extracts domain keywords from any document

## Setup & Run
```bash
cd ml_service
pip install -r requirements.txt
python ml_server.py
# Server runs on http://localhost:5001
```

## API
- `GET  /health`   — model status + training info
- `POST /analyze`  — `{ text, disabilityType }` → full NLP + ML analysis
- `POST /classify` — `{ sentences: [] }` → per-sentence complexity labels

## Integration
The main Express server at port 5000 calls this service at port 5001.
Add `ML_SERVICE_URL=http://localhost:5001` to your `.env`.
