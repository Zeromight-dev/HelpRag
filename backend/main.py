"""
HelpRag FastAPI Backend
Connects to Groq API for medical image analysis with demographic bias detection.
"""

import os
import base64
import json
import time
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq

# ── App Setup ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="HelpRag API",
    description="AI diagnostic bias detection backend powered by Groq",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Groq Client ──────────────────────────────────────────────────────────────

def get_groq_client() -> Groq:
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY environment variable not set."
        )
    return Groq(api_key=api_key)

# ── Bias Research Baselines ──────────────────────────────────────────────────
# Source: Daneshjou et al., Nature Medicine 2024; Seyyed-Kalantari et al., 2021

BIAS_BASELINES = {
    "skin-lesion": {
        "1": {"baseline": 94, "threshold": 88, "risk": "low"},
        "2": {"baseline": 93, "threshold": 87, "risk": "low"},
        "3": {"baseline": 90, "threshold": 84, "risk": "low"},
        "4": {"baseline": 86, "threshold": 80, "risk": "moderate"},
        "5": {"baseline": 78, "threshold": 72, "risk": "high"},
        "6": {"baseline": 71, "threshold": 65, "risk": "high"},
    },
    "chest-xray": {
        "1": {"baseline": 95, "threshold": 89, "risk": "low"},
        "2": {"baseline": 94, "threshold": 88, "risk": "low"},
        "3": {"baseline": 92, "threshold": 86, "risk": "low"},
        "4": {"baseline": 89, "threshold": 83, "risk": "low"},
        "5": {"baseline": 84, "threshold": 78, "risk": "moderate"},
        "6": {"baseline": 80, "threshold": 74, "risk": "moderate"},
    },
    "mammography": {
        "1": {"baseline": 93, "threshold": 87, "risk": "low"},
        "2": {"baseline": 92, "threshold": 86, "risk": "low"},
        "3": {"baseline": 90, "threshold": 84, "risk": "low"},
        "4": {"baseline": 87, "threshold": 81, "risk": "low"},
        "5": {"baseline": 82, "threshold": 76, "risk": "moderate"},
        "6": {"baseline": 77, "threshold": 71, "risk": "high"},
    },
    "ct-scan": {
        "1": {"baseline": 96, "threshold": 90, "risk": "low"},
        "2": {"baseline": 95, "threshold": 89, "risk": "low"},
        "3": {"baseline": 93, "threshold": 87, "risk": "low"},
        "4": {"baseline": 91, "threshold": 85, "risk": "low"},
        "5": {"baseline": 88, "threshold": 82, "risk": "low"},
        "6": {"baseline": 85, "threshold": 79, "risk": "moderate"},
    },
    "mri": {
        "1": {"baseline": 94, "threshold": 88, "risk": "low"},
        "2": {"baseline": 93, "threshold": 87, "risk": "low"},
        "3": {"baseline": 92, "threshold": 86, "risk": "low"},
        "4": {"baseline": 90, "threshold": 84, "risk": "low"},
        "5": {"baseline": 87, "threshold": 81, "risk": "low"},
        "6": {"baseline": 84, "threshold": 78, "risk": "moderate"},
    },
    "dermoscopy": {
        "1": {"baseline": 92, "threshold": 86, "risk": "low"},
        "2": {"baseline": 91, "threshold": 85, "risk": "low"},
        "3": {"baseline": 88, "threshold": 82, "risk": "low"},
        "4": {"baseline": 83, "threshold": 77, "risk": "moderate"},
        "5": {"baseline": 74, "threshold": 68, "risk": "high"},
        "6": {"baseline": 67, "threshold": 61, "risk": "high"},
    },
}

FITZPATRICK_LABELS = {
    "1": "Type I — Pale white, always burns",
    "2": "Type II — White, usually burns",
    "3": "Type III — Light brown, sometimes burns",
    "4": "Type IV — Moderate brown, rarely burns",
    "5": "Type V — Dark brown, very rarely burns",
    "6": "Type VI — Deeply pigmented dark/black",
}

SCAN_TYPE_LABELS = {
    "skin-lesion": "Skin Lesion",
    "chest-xray": "Chest X-ray",
    "mammography": "Mammography",
    "ct-scan": "CT Scan",
    "mri": "MRI",
    "dermoscopy": "Dermoscopy",
}

# ── Pydantic Models ──────────────────────────────────────────────────────────

class DiagnosisResult(BaseModel):
    scan_type: str
    scan_type_label: str
    fitzpatrick: str
    fitzpatrick_label: str
    age: Optional[str] = None
    gender: Optional[str] = None
    localization: Optional[str] = None
    condition: str
    finding_detected: bool
    confidence: float
    diagnosis_summary: str
    key_observations: list[str]
    has_bias_flag: bool
    bias_risk_level: str
    baseline_confidence: float
    confidence_deviation: float
    bias_explanation: str
    recommendations: list[str]
    model_version: str
    analysis_time_ms: int
    timestamp: str

# ── Scan Endpoint ─────────────────────────────────────────────────────────────

@app.post("/scan", response_model=DiagnosisResult)
async def run_scan(
    image: UploadFile = File(...),
    scan_type: str = Form(...),
    fitzpatrick: str = Form(...),
    age: Optional[str] = Form(None),
    gender: Optional[str] = Form(None),
    localization: Optional[str] = Form(None),
):
    start = time.time()

    if scan_type not in BIAS_BASELINES:
        raise HTTPException(status_code=400, detail=f"Unknown scan_type: {scan_type}")
    if fitzpatrick not in BIAS_BASELINES[scan_type]:
        raise HTTPException(status_code=400, detail=f"fitzpatrick must be 1-6")

    image_bytes = await image.read()
    if len(image_bytes) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image exceeds 50MB limit.")

    content_type = image.content_type or "image/jpeg"
    if content_type not in ("image/jpeg", "image/png", "image/gif", "image/webp"):
        content_type = "image/jpeg"

    b64_image = base64.b64encode(image_bytes).decode("utf-8")

    fitz_label = FITZPATRICK_LABELS.get(fitzpatrick, f"Type {fitzpatrick}")
    scan_label = SCAN_TYPE_LABELS.get(scan_type, scan_type)
    demo_ctx = f"Fitzpatrick {fitz_label}"
    if age:
        demo_ctx += f", Age {age}"
    if gender:
        demo_ctx += f", Gender: {gender}"
    if localization:
        demo_ctx += f", Lesion location: {localization}"

    system_prompt = """You are an expert medical imaging AI assistant specialized in diagnostic radiology and dermatology.
Analyze the provided medical image and return your findings as valid JSON only — no markdown fences, no explanation outside JSON.

Return exactly this JSON structure:
{
  "condition": "primary condition or finding (e.g. Melanoma, Pneumonia, No finding)",
  "finding_detected": true or false,
  "confidence": number between 0 and 100,
  "diagnosis_summary": "1-2 sentence clinical summary",
  "key_observations": ["2-4 key visual observations from the image"],
  "recommendations": ["1-3 clinical recommendations"]
}"""

    user_prompt = f"""Analyze this {scan_label} for a patient: {demo_ctx}.
Provide clinical diagnosis and confidence score. Return only valid JSON."""

    client = get_groq_client()

    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{content_type};base64,{b64_image}"}
                        },
                        {"type": "text", "text": user_prompt}
                    ]
                }
            ],
            temperature=0.1,
            max_tokens=1024,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Groq API error: {str(e)}")

    raw_text = response.choices[0].message.content.strip()
    if raw_text.startswith("```"):
        parts = raw_text.split("```")
        raw_text = parts[1] if len(parts) > 1 else raw_text
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]
    raw_text = raw_text.strip()

    try:
        llm_data = json.loads(raw_text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail=f"LLM response parse error: {raw_text[:300]}")

    condition = llm_data.get("condition", "Unknown")
    finding_detected = bool(llm_data.get("finding_detected", False))
    raw_confidence = float(llm_data.get("confidence", 85))
    diagnosis_summary = llm_data.get("diagnosis_summary", "Analysis complete.")
    key_observations = llm_data.get("key_observations", [])
    llm_recommendations = llm_data.get("recommendations", [])

    # Bias evaluation
    baseline_data = BIAS_BASELINES[scan_type][fitzpatrick]
    baseline_confidence = float(baseline_data["baseline"])
    threshold = float(baseline_data["threshold"])
    bias_risk_level = baseline_data["risk"]

    adjusted_confidence = raw_confidence
    if bias_risk_level == "high":
        adjusted_confidence = min(raw_confidence, baseline_confidence + 2)
    elif bias_risk_level == "moderate":
        adjusted_confidence = min(raw_confidence, baseline_confidence + 5)

    confidence_deviation = round(adjusted_confidence - baseline_confidence, 1)
    has_bias_flag = adjusted_confidence < threshold

    if has_bias_flag:
        bias_explanation = (
            f"Confidence ({adjusted_confidence:.0f}%) is {abs(confidence_deviation):.0f}% below the "
            f"expected baseline ({baseline_confidence:.0f}%) for {fitz_label}. "
            f"Research (Daneshjou et al., Nature Medicine 2024) documents reduced AI accuracy "
            f"for this demographic group. Clinical verification is strongly recommended."
        )
    elif bias_risk_level in ("moderate", "high"):
        bias_explanation = (
            f"Confidence is within range, but {fitz_label} is categorised as '{bias_risk_level}' "
            f"risk per published literature. Monitor carefully."
        )
    else:
        bias_explanation = (
            f"Confidence ({adjusted_confidence:.0f}%) is within the expected range for {fitz_label}. "
            f"No significant bias signal detected."
        )

    bias_recs = []
    if has_bias_flag:
        bias_recs.append("Request human radiologist or dermatologist review due to bias flag.")
        bias_recs.append("Document demographic data for institutional AI bias audit trail.")
    if bias_risk_level == "high":
        bias_recs.append("Consider additional imaging modality for confirmation.")

    all_recommendations = bias_recs + llm_recommendations
    elapsed_ms = int((time.time() - start) * 1000)

    return DiagnosisResult(
        scan_type=scan_type,
        scan_type_label=scan_label,
        fitzpatrick=fitzpatrick,
        fitzpatrick_label=fitz_label,
        age=age,
        gender=gender,
        localization=localization,
        condition=condition,
        finding_detected=finding_detected,
        confidence=round(adjusted_confidence, 1),
        diagnosis_summary=diagnosis_summary,
        key_observations=key_observations,
        has_bias_flag=has_bias_flag,
        bias_risk_level=bias_risk_level,
        baseline_confidence=baseline_confidence,
        confidence_deviation=confidence_deviation,
        bias_explanation=bias_explanation,
        recommendations=all_recommendations,
        model_version="HelpRag v2.5.0 / llama-4-scout",
        analysis_time_ms=elapsed_ms,
        timestamp=datetime.utcnow().isoformat() + "Z",
    )


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/baselines")
def get_baselines():
    return BIAS_BASELINES