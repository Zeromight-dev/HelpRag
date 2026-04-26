// Types matching the FastAPI backend response models

export interface DiagnosisResult {
  scan_type: string
  scan_type_label: string
  fitzpatrick: string
  fitzpatrick_label: string
  age?: string
  gender?: string
  localization?: string
  condition: string
  finding_detected: boolean
  confidence: number
  diagnosis_summary: string
  key_observations: string[]
  has_bias_flag: boolean
  bias_risk_level: "low" | "moderate" | "high"
  baseline_confidence: number
  confidence_deviation: number
  bias_explanation: string
  recommendations: string[]
  model_version: string
  analysis_time_ms: number
  timestamp: string
}

export const API_BASE = "helprag-production.up.railway.app"

export async function submitScan(
  image: File,
  scanType: string,
  fitzpatrick: string,
  age: string,
  gender: string,
  localization?: string
): Promise<DiagnosisResult> {
  const formData = new FormData()
  formData.append("image", image)
  formData.append("scan_type", scanType)
  formData.append("fitzpatrick", fitzpatrick)
  if (age) formData.append("age", age)
  if (gender) formData.append("gender", gender)
  if (localization) formData.append("localization", localization)

  const res = await fetch(`${API_BASE}/scan`, {
    method: "POST",
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }

  return res.json()
}