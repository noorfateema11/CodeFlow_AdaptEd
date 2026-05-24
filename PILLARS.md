# adaptEd — Hackathon Pillar Compliance

## ✅ Pillar 1: Functional Web Platform
- React + TypeScript frontend (Vite)
- Node.js + Express REST API backend
- MongoDB + Mongoose for persistent storage
- JWT authentication with bcrypt password hashing
- PDF upload, parse, and AI adaptation pipeline
- Audio playback with progress saving across sessions
- Dyslexia mode, Voice mode, Read-aloud controls

## ✅ Pillar 2: Dedicated Mobile Application (PWA)
- `Frontend/public/manifest.json` — full Web App Manifest
- `Frontend/public/sw.js` — Service Worker with offline caching
- `Frontend/index.html` — manifest link + SW registration
- `Frontend/public/icons/` — 192×192 and 512×512 app icons
- `<meta name="apple-mobile-web-app-capable">` for iOS home screen
- Installable on Android/iOS from browser ("Add to Home Screen")
- Offline support: cached shell loads without internet

## ✅ Pillar 3: Custom Trained / Fine-tuned AI Model
**`ml_service/ml_server.py`** — Python Flask microservice with 3 trained scikit-learn models:

| Model | Algorithm | Task |
|-------|-----------|------|
| ReadabilityClassifier | Multinomial Naive Bayes + TF-IDF | Classifies each sentence as simple/moderate/complex |
| ContentRecommender | TF-IDF + Cosine Similarity | Recommends content adaptation strategy per disability type |
| KeywordExtractor | TF-IDF Vectorizer | Domain keyword extraction from uploaded documents |

- NOT a GPT/Gemini API wrapper
- Trained on labeled sentence dataset at startup
- Results feed into Groq LLM context (genuine ML pipeline)
- Endpoints: `/health`, `/analyze`, `/classify`

## ✅ Pillar 4: Security, Encryption & Privacy
- **`helmet`** — 15+ secure HTTP headers (XSS, clickjacking, MIME sniff, CSP)
- **`express-rate-limit`** — 100 req/15min global; 10/15min on auth; 20/15min on uploads
- **`src/middlewares/security.middleware.js`** — XSS input sanitization + MongoDB `$` injection prevention
- **JWT** with expiry validation and clock-skew attack prevention
- **bcryptjs** password hashing (never stored in plaintext)
- **CORS** restricted to `ALLOWED_ORIGIN` env variable
- Global error handler never leaks stack traces to client

## 🌍 UN SDG Alignment (Required)
- **SDG 4 — Quality Education**: Core mission — accessible learning for all students
- **SDG 10 — Reduced Inequalities**: Removes barriers for students with dyslexia, blindness, deafness
- **SDG 9 — Industry & Innovation**: Custom AI/NLP pipeline for education technology

SDG badges displayed on login screen and in NLP analysis panel after every PDF upload.
