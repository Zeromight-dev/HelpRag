# HelpRag — AI Diagnostic Bias Detection Tool

A full-stack medical AI tool that analyzes diagnostic images and flags potential demographic bias in AI confidence scores, cross-referenced against peer-reviewed research baselines.

---

## What It Does

Medical AI models have documented accuracy disparities across demographic groups — particularly across Fitzpatrick skin types. HelpRag makes this visible by:

- Running AI image analysis via **Groq (Llama 4 Scout vision model)**
- Cross-referencing AI confidence against **published bias baselines** (Daneshjou et al., Nature Medicine 2024)
- Flagging scans where confidence falls below the expected threshold for that demographic
- Tracking scan history with search, filter, and PDF export

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, Python 3.13 |
| AI Model | Groq API — `meta-llama/llama-4-scout-17b-16e-instruct` |
| Charts | Recharts |
| State | localStorage + sessionStorage |

---

## Features

- **New Scan** — Upload medical image + patient demographics (age, gender, Fitzpatrick scale, body localization)
- **Scan Types** — Chest X-ray, Skin Lesion, Dermoscopy, Mammography, CT Scan, MRI
- **Bias Evaluation** — Confidence vs baseline comparison with risk level (low / moderate / high)
- **Dashboard** — Live stats and confidence-by-Fitzpatrick chart from scan history
- **History** — Search, filter by bias/scan type/risk, sort, delete, export to PDF
- **Human Review** — One-time flag to request clinical verification, tracked in history
- **PDF Export** — Full diagnostic report with bias evaluation

---

## Project Structure

```
Helprag/
├── Backend/
│   ├── main.py           # FastAPI app + /scan endpoint
│   ├── requirements.txt  # Python dependencies
│   └── .env              # GROQ_API_KEY (not committed)
└── Frontend/
    ├── app/
    │   ├── layout.tsx
    │   └── (app)/
    │       ├── page.tsx          # Dashboard
    │       ├── scan/page.tsx     # New scan form
    │       ├── results/page.tsx  # Diagnosis + bias results
    │       ├── history/page.tsx  # Scan history
    │       └── methodology/page.tsx
    ├── components/
    ├── lib/
    │   ├── api.ts          # API types + fetch helper
    │   └── pdf-export.ts   # PDF report generator
    └── .env.local          # API URL (not committed)
```

---

## Setup & Running

### Prerequisites
- Python 3.10+
- Node.js 18+
- Groq API key — free at [console.groq.com](https://console.groq.com)

### Backend

```bash
cd Backend
pip install -r requirements.txt
```

Create a `.env` file in the `Backend/` folder:
```
GROQ_API_KEY=your_groq_api_key_here
```

Run the backend:
```bash
# Mac/Linux
uvicorn main:app --reload --port 8000

# Windows PowerShell
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd Frontend
npm install
```

Create a `.env.local` file in the `Frontend/` folder:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the frontend:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Bias Baselines Reference

Confidence thresholds are derived from:

- **Daneshjou et al.** — *Disparities in dermatology AI performance on a diverse, curated clinical image set.* Nature Medicine, 2024
- **Seyyed-Kalantari et al.** — *Underdiagnosis bias of artificial intelligence algorithms applied to chest radiographs in under-served patient populations.* Nature Medicine, 2021

| Fitzpatrick Type | Skin Description | Dermoscopy Baseline | Skin Lesion Baseline |
|---|---|---|---|
| Type I | Pale white | 92% | 94% |
| Type II | White | 91% | 93% |
| Type III | Light brown | 88% | 90% |
| Type IV | Moderate brown | 83% | 86% |
| Type V | Dark brown | 74% ⚠ | 78% ⚠ |
| Type VI | Deeply pigmented | 67% ⚠ | 71% ⚠ |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/scan` | Analyze image + return diagnosis and bias flag |
| `GET` | `/health` | Health check |
| `GET` | `/baselines` | Full bias baselines JSON |

### POST /scan — Form Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `image` | file | Yes | Medical image (JPEG/PNG, max 50MB) |
| `scan_type` | string | Yes | e.g. `skin-lesion`, `dermoscopy`, `chest-xray` |
| `fitzpatrick` | string | Yes | `1` through `6` |
| `age` | string | No | Patient age |
| `gender` | string | No | Patient gender |
| `localization` | string | No | Body location (skin-lesion/dermoscopy only) |

---

## Disclaimer

This tool is a research prototype for demonstrating AI diagnostic bias. It is **not a substitute for professional medical diagnosis**. All results should be reviewed by a qualified clinician.