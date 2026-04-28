"""
PrismDX FastAPI Backend
Connects to Gemini API for medical image analysis with demographic bias detection.
Uses: google-genai (new SDK) with gemini-2.0-flash and automatic fallback.
"""
from dotenv import load_dotenv
load_dotenv()

import os
import json
import time
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types

# ── App Setup ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="PrismDX API",
    description="AI diagnostic bias detection backend powered by Google Gemini",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://prismdx-2026.web.app",
        "https://prismdx-2026.firebaseapp.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Model Configuration ───────────────────────────────────────────────────────
PRIMARY_MODEL = "gemini-2.5-flash" 
FALLBACK_MODEL = "gemini-2.0-flash"

# ── Gemini Client ─────────────────────────────────────────────────────────────

def get_gemini_client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY not set. Get your free key at https://aistudio.google.com"
        )
    return genai.Client(api_key=api_key)

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
    model_config = {"protected_namespaces": ()}

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
        raise HTTPException(status_code=400, detail="fitzpatrick must be 1-6")

    image_bytes = await image.read()
    if len(image_bytes) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image exceeds 50MB limit.")

    content_type = image.content_type or "image/jpeg"
    if content_type not in ("image/jpeg", "image/png", "image/gif", "image/webp"):
        content_type = "image/jpeg"

    fitz_label = FITZPATRICK_LABELS.get(fitzpatrick, f"Type {fitzpatrick}")
    scan_label = SCAN_TYPE_LABELS.get(scan_type, scan_type)
    
    client = get_gemini_client()

    # ── Internal Unified Generation Helper ──
    def generate_with_fallback(model_parts: list, is_json: bool = False):
        config_args = {"temperature": 0.1}
        if is_json:
            config_args["response_mime_type"] = "application/json"
        else:
            config_args["max_output_tokens"] = 10

        try:
            # Try Primary
            res = client.models.generate_content(
                model=PRIMARY_MODEL,
                contents=model_parts,
                config=types.GenerateContentConfig(**config_args)
            )
            return res, PRIMARY_MODEL
        except Exception as e:
            # Check for Resource Exhaustion
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                res = client.models.generate_content(
                    model=FALLBACK_MODEL,
                    contents=model_parts,
                    config=types.GenerateContentConfig(**config_args)
                )
                return res, FALLBACK_MODEL
            raise e

    # ── Image Validation ─────────────────────────────────────────────────────
    try:
        validation_parts = [
            types.Part.from_bytes(data=image_bytes, mime_type=content_type),
            f"Is this a genuine medical image of type '{scan_label}'? Reply only YES or NO."
        ]
        v_response, _ = generate_with_fallback(validation_parts, is_json=False)
        
        if v_response.text.strip().upper().startswith("NO"):
            raise HTTPException(
                status_code=422,
                detail=f"Image does not appear to be a valid {scan_label}. Please upload a genuine medical image."
            )
    except HTTPException:
        raise
    except Exception:
        pass # Silently continue if validation API fails but not due to medical mismatch

    # ── Main Analysis ────────────────────────────────────────────────────────
    demo_ctx = f"Fitzpatrick {fitz_label}"
    if age: demo_ctx += f", Age {age}"
    if gender: demo_ctx += f", Gender: {gender}"
    if localization: demo_ctx += f", Lesion location: {localization}"

    prompt = (
        f"You are an expert medical imaging AI assistant specialized in diagnostic radiology and dermatology. "
        f"Analyze the provided {scan_label} for a patient: {demo_ctx}. "
        f"Return ONLY a valid JSON object with exactly this structure: "
        f'{{"condition": "primary condition", "finding_detected": true, "confidence": 85, '
        f'"diagnosis_summary": "clinical summary", "key_observations": ["obs"], "recommendations": ["rec"]}}'
    )

    try:
        analysis_parts = [
            types.Part.from_bytes(data=image_bytes, mime_type=content_type),
            prompt
        ]
        response, used_model = generate_with_fallback(analysis_parts, is_json=True)
        raw_text = response.text.strip()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {str(e)}")

    # ── Parse JSON ────────────────────────────────────────────────────────────
    if raw_text.startswith("```"):
        raw_text = raw_text.split("```")[1]
        if raw_text.startswith("json"): raw_text = raw_text[4:]
    raw_text = raw_text.strip()

    try:
        llm_data = json.loads(raw_text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Failed to parse AI response.")

    # ── Bias Evaluation ───────────────────────────────────────────────
    baseline_data = BIAS_BASELINES[scan_type][fitzpatrick]
    raw_confidence = float(llm_data.get("confidence", 85))
    baseline_conf = float(baseline_data["baseline"])
    threshold = float(baseline_data["threshold"])
    base_risk_level = baseline_data["risk"]

    # Don't adjust confidence — evaluate it as-is
    # Bias flag triggers when confidence is suspiciously HIGH
    # for a demographic known to be underserved, OR suspiciously LOW
    has_bias_flag = (
        raw_confidence < threshold  # underconfident — classic bias
        or (base_risk_level == "high" and raw_confidence > baseline_conf + 10)  # overconfident on high-risk group — also suspicious
    )

    # Deviation from baseline
    dev = round(raw_confidence - baseline_conf, 1)

    # Risk level — elevate if flagged on already high-risk group
    if has_bias_flag and base_risk_level == "high":
        bias_risk_level = "high"
    elif has_bias_flag:
        bias_risk_level = "moderate"
    else:
        bias_risk_level = base_risk_level

    if has_bias_flag:
        if raw_confidence < threshold:
            bias_explanation = (
            f"Confidence ({raw_confidence:.0f}%) is {abs(dev):.0f}% below the "
            f"expected baseline ({baseline_conf:.0f}%) for {fitz_label}. "
            f"Published research indicates elevated risk of diagnostic bias for this demographic."
        )
        else:
            bias_explanation = (
                f"Unusually high confidence ({raw_confidence:.0f}%) for {fitz_label}, "
                f"which is a demographic historically underrepresented in training data. "
                f"Result should be verified by a clinician."
        )
    else:
        bias_explanation = (
            f"Confidence ({raw_confidence:.0f}%) is within the expected range "
            f"for {fitz_label} (baseline: {baseline_conf:.0f}%). No bias flag triggered."
        )

    recs = (["Request human review due to potential demographic bias."] if has_bias_flag else []) + llm_data.get("recommendations", [])

    return DiagnosisResult(
        scan_type=scan_type,
        scan_type_label=scan_label,
        fitzpatrick=fitzpatrick,
        fitzpatrick_label=fitz_label,
        age=age,
        gender=gender,
        localization=localization,
        condition=llm_data.get("condition", "Unknown"),
        finding_detected=bool(llm_data.get("finding_detected", False)),
        confidence=round(raw_confidence, 1),
        diagnosis_summary=llm_data.get("diagnosis_summary", ""),
        key_observations=llm_data.get("key_observations", []),
        has_bias_flag=has_bias_flag,
        bias_risk_level=bias_risk_level,
        baseline_confidence=baseline_conf,
        confidence_deviation=dev,
        bias_explanation=bias_explanation,
        recommendations=recs,
        model_version=f"PrismDX v3.0.0 / {used_model}",
        analysis_time_ms=int((time.time() - start) * 1000),
        timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
    )

@app.get("/health")
def health():
    return {"status": "ok", "primary": PRIMARY_MODEL, "fallback": FALLBACK_MODEL}

@app.get("/baselines")
def get_baselines():
    return BIAS_BASELINES