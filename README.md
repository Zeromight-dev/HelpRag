# PrismDX — AI Diagnostic Bias Detection Tool

> **Google Solution Challenge 2026** — SDG 3: Good Health and Well-Being

A full-stack medical AI tool that analyses diagnostic images and flags potential demographic bias in AI confidence scores, cross-referenced against peer-reviewed Fitzpatrick-stratified baselines.

🔗 **Live Demo:** https://prismdx-2026.web.app

---

## What It Does

Medical AI models have documented accuracy disparities across demographic groups — particularly across Fitzpatrick skin types (up to 23% lower accuracy for Types V–VI). PrismDX makes this visible at the point of care by:

- Running AI image analysis via **Gemini 2.5 Flash**
- Cross-referencing AI confidence against **published bias baselines** (Daneshjou et al., Nature Medicine 2024; Seyyed-Kalantari et al., 2021)
- Flagging scans where confidence falls below the expected threshold for that demographic — or where confidence is suspiciously high on historically underserved skin types
- Tracking scan history with search, filter, and PDF export
- Providing clinicians with a one-click human review request tied to the audit trail

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, Python 3.13 |
| AI Model | Google Gemini 2.5 Flash (`gemini-2.5-flash`) with `gemini-2.0-flash` fallback |
| Hosting | Firebase Hosting |
| Backend Hosting | Railway |
| Charts | Recharts |
| State | localStorage + sessionStorage |

---

## Features

- **New Scan** — Upload a medical image with patient demographics (age, gender, Fitzpatrick scale, body localization)
- **Scan Types** — Dermoscopy, Skin Lesion, Chest X-ray, Mammography, CT Scan, MRI
- **Image Validation** — Gemini validates uploads are genuine medical images before analysis
- **Bias Evaluation** — Confidence vs Fitzpatrick baseline comparison with risk level (low / moderate / high)
- **Bias Flag** — Triggers when confidence is below threshold for the demographic, or unusually high on high-risk Fitzpatrick types (V/VI)
- **Dashboard** — Live stats (total scans, bias flags, avg confidence, clear rate) and confidence-by-Fitzpatrick chart
- **History** — Search, filter by bias flag / scan type / risk level, sort, delete, export to PDF
- **Human Review** — One-time flag to request clinical verification, persisted in history
- **PDF Export** — Full diagnostic report including bias evaluation and recommendations

---

## Project Structure

```
PrismDX/
├── Backend/
│   ├── main.py           # FastAPI app + /scan endpoint + bias logic
│   ├── requirements.txt  # Python dependencies
│   └── .env              # GEMINI_API_KEY (not committed)
└── Frontend/
    ├── firebase.json     # Firebase hosting config (cleanUrls enabled)
    ├── app/
    │   ├── layout.tsx
    │   └── (app)/
    │       ├── page.tsx            # Dashboard
    │       ├── layout.tsx          # Shared sidebar layout
    │       ├── scan/page.tsx       # New scan form
    │       ├── results/page.tsx    # Diagnosis + bias results
    │       ├── history/page.tsx    # Scan history
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
- Gemini API key — free at [aistudio.google.com](https://aistudio.google.com)

### Backend

```bash
cd Backend
pip install -r requirements.txt
```

Create a `.env` file in the `Backend/` folder:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

Run the backend:
```bash
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

### Deploy to Firebase

```bash
cd Frontend
npm run build
firebase deploy --only hosting
```

> **Note:** Ensure `firebase.json` is in the **root** of the project with `"public": "Frontend/out"` and `"cleanUrls": true`.

---

## Bias Detection Logic

Bias flags are raised in two scenarios:

1. **Underconfidence** — AI confidence falls below the published threshold for the patient's Fitzpatrick type (classic bias pattern)
2. **Overconfidence on high-risk types** — AI confidence is suspiciously high (>10% above baseline) for Fitzpatrick Types V or VI, which are historically underrepresented in training data

### Baselines Reference

Derived from peer-reviewed research:

| Fitzpatrick Type | Skin Description | Dermoscopy Baseline | Skin Lesion Baseline |
|---|---|---|---|
| Type I | Pale white | 92% | 94% |
| Type II | White | 91% | 93% |
| Type III | Light brown | 88% | 90% |
| Type IV | Moderate brown | 83% | 86% |
| Type V | Dark brown | 74% ⚠️ | 78% ⚠️ |
| Type VI | Deeply pigmented | 67% ⚠️ | 71% ⚠️ |

**Sources:**
- Daneshjou et al. — *Disparities in dermatology AI performance on a diverse, curated clinical image set.* Nature Medicine, 2024
- Seyyed-Kalantari et al. — *Underdiagnosis bias of artificial intelligence algorithms applied to chest radiographs in under-served patient populations.* Nature Medicine, 2021

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/scan` | Analyse image + return diagnosis and bias evaluation |
| `GET` | `/health` | Health check + active model info |
| `GET` | `/baselines` | Full bias baselines JSON for all scan types |

### POST /scan — Form Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `image` | file | Yes | Medical image (JPEG/PNG/WebP, max 50MB) |
| `scan_type` | string | Yes | `skin-lesion`, `dermoscopy`, `chest-xray`, `mammography`, `ct-scan`, `mri` |
| `fitzpatrick` | string | Yes | `1` through `6` |
| `age` | string | No | Patient age |
| `gender` | string | No | Patient gender |
| `localization` | string | No | Body location (relevant for skin scans) |

### Example Response

```json
{
  "condition": "Melanoma (highly suspicious)",
  "finding_detected": true,
  "confidence": 90.0,
  "baseline_confidence": 88.0,
  "has_bias_flag": false,
  "bias_risk_level": "low",
  "bias_explanation": "Confidence within expected range for Type III.",
  "fitzpatrick_label": "Type III — Light brown, sometimes burns",
  "model_version": "PrismDX v3.0.0 / gemini-2.5-flash",
  "timestamp": "2026-04-28T11:39:58.214Z"
}
```

---

## Disclaimer

PrismDX is a research prototype built for the Google Solution Challenge 2026. It is **not a substitute for professional medical diagnosis**. All results must be reviewed by a qualified clinician before informing any medical decision.
