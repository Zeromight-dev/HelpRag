# HelpRag Backend

FastAPI backend for HelpRag diagnostic bias detection tool, powered by Groq AI.

## Setup (Windows PowerShell)

```powershell
cd helprag-backend
uvicorn main:app --reload --port 8000
```

## Setup (Mac / Linux)

```bash
cd helprag-backend
uvicorn main:app --reload --port 8000
```

The API will be at: http://localhost:8000
Swagger docs at: http://localhost:8000/docs

## Endpoints

- POST /scan   — Upload image + demographics → diagnosis + bias flag
- GET /health  — Health check
- GET /baselines — Full bias baselines table

## Notes

- The pip httpx warning is safe to ignore — packages installed fine
- Keep backend running while using the frontend
- Default port 8000 matches the frontend .env.local
