# adaptEd

**An inclusive learning platform that adapts any document to the way you read.**

Built for the CodeFlow Hackathon @ St. Thomas' College of Engineering & Technology (STCET), Kolkata.

adaptEd takes a PDF and rewrites it on the fly for dyslexic readers, blind/screen-reader users, Deaf users, and visual learners — using a real trained ML pipeline plus an LLM, packaged as an installable, offline-capable PWA.

---

## Table of Contents

- [Why adaptEd](#why-adapted)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [UN SDG Alignment](#un-sdg-alignment)
- [Security](#security)
- [Roadmap](#roadmap)
- [License](#license)

---

## Why adaptEd

Standard course material — dense PDFs, long paragraphs, jargon-heavy text — is a barrier for a huge number of learners. adaptEd sits between a student and any document and re-renders it for _their_ needs: shorter sentences for dyslexia, narrated plain-language summaries for blind users, direct unambiguous phrasing for Deaf users, and scannable bullet structures for visual learners.

## Features

- **Upload & adapt** — drop in a PDF, get an accessibility-tailored rewrite in seconds
- **Dyslexia mode** — short sentences, simple vocabulary, spaced paragraphs, bullet structuring
- **Blind mode** — screen-reader-first plain-prose summaries with full keyboard navigation and a live narration HUD
- **Deaf mode** — short, direct, idiom-free, active-voice rewrites
- **Visual-learning mode** — heading + bullet extraction for fast scanning
- **Audio playback** — read-aloud with progress saved per document, per user, across sessions
- **Bookmarks** — save and jump back to specific paragraphs
- **Keyboard-first navigation** — full app usable without a mouse, with an in-app shortcut reference
- **Installable PWA** — add to home screen on Android/iOS, works offline after first load
- **NLP insights panel** — readability score, complex-sentence count, and extracted keywords shown after every upload

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌────────────────────┐
│  React + Vite    │ ───► │  Node / Express    │ ───► │  Flask ML Service   │
│  (PWA frontend)  │ ◄─── │  REST API          │ ◄─── │  scikit-learn        │
└─────────────────┘      │  + MongoDB          │      │  (NB classifier,     │
                          │  + JWT auth         │      │   TF-IDF recommender,│
                          └────────┬────────────┘      │   keyword extractor) │
                                   │                     └────────────────────┘
                                   ▼
                          ┌──────────────────┐
                          │   Groq LLM API     │
                          │  (rewrite engine,  │
                          │   informed by ML)   │
                          └──────────────────┘
```

A document upload is never sent to the LLM blind. It first passes through the scikit-learn pipeline (readability classification, content-strategy recommendation, keyword extraction), and that analysis is injected into the LLM prompt as context — so the rewrite is grounded in real NLP output, not just a raw prompt wrapper.

## Tech Stack

**Frontend:** React 18, TypeScript, Vite, Service Worker (PWA)
**Backend:** Node.js, Express, MongoDB + Mongoose, JWT, bcrypt
**ML Service:** Python, Flask, scikit-learn (Multinomial Naive Bayes, TF-IDF, cosine similarity)
**LLM:** Groq (Llama 3.3 / Llama 4 Scout)
**Security:** Helmet, express-rate-limit, custom XSS/NoSQL-injection sanitizer

## Project Structure

```
adaptEd/
├── server.js                      # Express entry point
├── src/
│   ├── config/db.js                # MongoDB connection
│   ├── controllers/                # auth, lessons, bookmarks, PDF handling
│   ├── middlewares/                # auth + security middleware
│   ├── models/                     # Mongoose schemas
│   ├── routes/                     # /api/auth, /api/lessons, /api/bookmarks, /api/pdf, /api/audio
│   └── services/ai.service.js      # ML + LLM adaptation pipeline
├── ml_service/
│   ├── ml_server.py                # Flask microservice — trained scikit-learn models
│   └── requirements.txt
└── Frontend/
    ├── src/
    │   ├── components/              # Companion, BlindHUD, AudioPlayer, PdfUploader, etc.
    │   ├── context/AccessibilityContext.tsx
    │   ├── hooks/                   # keyboard manager, focus narration
    │   └── App.tsx
    └── public/                      # manifest.json, service worker, icons
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- A MongoDB Atlas connection string (or local MongoDB)
- A Groq API key

### 1. Clone and install

```bash
git clone https://github.com/<noorfateema11>/adapted.git
cd adapted
npm install
cd Frontend && npm install && cd ..
cd ml_service && pip install -r requirements.txt && cd ..
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env` with your own values — see [Environment Variables](#environment-variables) below. **Never commit this file.**

### 3. Run everything

```bash
# Backend + ML service together
npm run dev:all

# Or individually:
npm run dev      # Express API on :5000
npm run ml       # Flask ML service on :5001

# Frontend (separate terminal)
cd Frontend && npm run dev   # Vite dev server on :5173
```

Visit `http://localhost:5173`.

## Environment Variables

Create `.env` in the project root (never commit it — see `.env.example` for the template):

| Variable         | Description                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `MONGO_URI`      | MongoDB connection string                                                                                                      |
| `JWT_SECRET`     | Secret for signing JWTs — use a long random value (`node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`) |
| `GROQ_API_KEY`   | API key for Groq LLM calls                                                                                                     |
| `ML_SERVICE_URL` | URL of the Flask ML microservice (e.g. `http://localhost:5001`)                                                                |
| `ALLOWED_ORIGIN` | Frontend origin allowed by CORS (e.g. `http://localhost:5173`)                                                                 |
| `PORT`           | Express server port (default `5000`)                                                                                           |

Frontend uses its own variable in `Frontend/.env`:

| Variable       | Description                                |
| -------------- | ------------------------------------------ |
| `VITE_API_URL` | Base URL of the deployed/local backend API |

## API Reference

All routes except `/signup`, `/login`, and `/pdf/status` require `Authorization: Bearer <token>`.

**Auth**

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/profile`
- `PATCH /api/auth/disability`

**Documents**

- `GET /api/pdf/status`
- `POST /api/pdf/upload` — multipart, field `pdf`, 10MB max
- `GET /api/pdf/my-documents`
- `GET /api/pdf/:id`

**Lessons**

- `GET /api/lessons`
- `POST /api/lessons`

**Bookmarks**

- `POST /api/bookmarks/toggle`
- `GET /api/bookmarks`

**Audio progress**

- `POST /api/audio/progress/:documentId`
- `GET /api/audio/progress/:documentId`
- `GET /api/audio/progress`

**ML Microservice** (internal, called by the backend)

- `GET /health`
- `POST /analyze`
- `POST /classify`

## Deployment

| Component                  | Suggested host                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| ML service (`ml_service/`) | Render — root dir `ml_service`, build `pip install -r requirements.txt`, start `python ml_server.py` |
| Backend (root)             | Render/Railway — build `npm install`, start `node server.js`; set all env vars in the dashboard      |
| Frontend (`Frontend/`)     | Vercel — framework Vite, root dir `Frontend`, env `VITE_API_URL` pointing at the deployed backend    |

After deploying, update `ALLOWED_ORIGIN` on the backend to your live frontend URL, and `ML_SERVICE_URL` to your live ML service URL.

## UN SDG Alignment

- **SDG 4 — Quality Education** — core mission: accessible learning material for every student
- **SDG 10 — Reduced Inequalities** — removes reading barriers for students with dyslexia, blindness, or deafness
- **SDG 9 — Industry & Innovation** — applies a custom NLP/ML pipeline to an education technology problem

## Security

- **Helmet** — 15+ secure HTTP headers (CSP, XSS protection, clickjacking, MIME sniffing)
- **Rate limiting** — 100 req/15min global, 10/15min on auth, 20/15min on uploads
- **Input sanitization** — strips HTML/script injection and MongoDB `$`-operator injection from every request body
- **JWT** — expiry validation plus clock-skew attack prevention
- **bcrypt** — passwords are never stored in plaintext
- **CORS** — restricted to a single allow-listed origin via `ALLOWED_ORIGIN`
- **Error handling** — the global error handler never leaks stack traces to the client

If you fork this repo, rotate every secret in `.env.example` before deploying — do not reuse any key that was ever committed to a public repository.
