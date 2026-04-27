"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle, CheckCircle, Download, UserCheck,
  Activity, ChevronRight, ArrowLeft, Info,
  ImageOff, RefreshCw, Upload, ScanLine, ShieldAlert
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { type DiagnosisResult } from "@/lib/api"
import { exportResultsToPDF } from "@/lib/pdf-export"
import { toast } from "sonner"

// ── Invalid Image State Type ─────────────────────────────────────────────────
interface InvalidImageResult {
  __invalid_image: true
  scan_type_label?: string
  message?: string
}

type PageResult = DiagnosisResult | InvalidImageResult

function isInvalidImage(r: PageResult): r is InvalidImageResult {
  return "__invalid_image" in r && r.__invalid_image === true
}

// ── Confidence Bar ────────────────────────────────────────────────────────────
function ConfidenceBar({ value, baseline }: { value: number; baseline: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">AI Confidence</span>
        <span className="font-semibold">{value.toFixed(1)}%</span>
      </div>
      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-orange-400 z-10"
          style={{ left: `${baseline}%` }}
        />
        <div
          className={`h-full rounded-full transition-all duration-700 ${value >= baseline ? "bg-green-500" : "bg-destructive"
            }`}
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0%</span>
        <span className="text-orange-500">Baseline: {baseline}%</span>
        <span>100%</span>
      </div>
    </div>
  )
}

// ── Invalid Image Screen ──────────────────────────────────────────────────────
function InvalidImageScreen({
  result,
  onRetry,
  onNewScan,
}: {
  result: InvalidImageResult
  onRetry: () => void
  onNewScan: () => void
}) {
  const scanLabel = result.scan_type_label ?? "medical scan"
  const message =
    result.message ??
    `The uploaded image does not appear to be a valid ${scanLabel}.`

  const requirements: Record<string, string[]> = {
    "Skin Lesion": [
      "Close-up photo of the skin area in question",
      "Clear, in-focus image under good lighting",
      "Natural skin colour — no filters or heavy editing",
      "Only skin visible — no objects, text overlays, or logos",
    ],
    "Chest X-ray": [
      "Standard PA or AP chest radiograph",
      "DICOM export or high-resolution JPEG/PNG",
      "Full chest visible including costophrenic angles",
      "No patient overlays or annotations that obscure anatomy",
    ],
    Mammography: [
      "CC or MLO mammographic view",
      "High-resolution greyscale image",
      "No compression artefacts or heavy JPEG artefacts",
      "Full breast tissue included",
    ],
    Dermoscopy: [
      "Dermoscope capture with polarised or immersion contact mode",
      "Lesion centred and in sharp focus",
      "No gel bubbles or excessive hair obscuring the lesion",
      "Minimum 640 × 640 px resolution",
    ],
  }

  const hints = requirements[scanLabel] ?? [
    "A genuine clinical photograph or radiological image",
    "High resolution with clear focus",
    "No filters, illustrations, or artistic overlays",
    "The anatomical region relevant to the scan type",
  ]

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-8">
      <div className="w-full max-w-lg space-y-6">

        {/* Icon + heading */}
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-20 h-20">
            {/* Pulsing ring */}
            <span className="absolute inset-0 rounded-full bg-amber-100 animate-ping opacity-50" />
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-200">
              <ImageOff className="w-8 h-8 text-amber-600" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground">Image Not Recognised</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* What went wrong */}
        <Card className="border-amber-200 bg-amber-50/60">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
              <ShieldAlert className="w-4 h-4" />
              Why was this rejected?
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <p className="text-sm text-amber-700 leading-relaxed">
              PrismDX validates every upload before analysis to prevent misleading
              diagnostic outputs. Illustrations, screenshots, stock photos, and
              non-clinical images can produce clinically meaningless — or actively
              harmful — results and bias scores.
            </p>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-sm flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-primary" />
              What a valid{" "}
              <span className="text-primary font-semibold">{scanLabel}</span>{" "}
              looks like
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <ul className="space-y-2">
              {hints.map((hint, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  {hint}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            className="flex-1 gap-2"
            onClick={onRetry}
          >
            <Upload className="w-4 h-4" />
            Upload a Different Image
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={onNewScan}
          >
            <RefreshCw className="w-4 h-4" />
            Start a New Scan
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          This image has <strong>not</strong> been saved to your scan history.
        </p>
      </div>
    </div>
  )
}

// ── Main Results Page ─────────────────────────────────────────────────────────
export default function ResultsPage() {
  const router = useRouter()
  const [result, setResult] = useState<PageResult | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [reviewRequested, setReviewRequested] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem("PrismDX_result")
    if (!stored) { router.push("/scan"); return }
    try {
      const parsed = JSON.parse(stored)
      setResult(parsed)
      setReviewRequested(!!parsed.human_review_requested)
    } catch {
      router.push("/scan")
    }
  }, [router])

  if (!result) return null

  // ── Invalid image branch ────────────────────────────────────────────────
  if (isInvalidImage(result)) {
    return (
      <TooltipProvider>
        <div>
          {/* Minimal back nav */}
          <div className="p-6 pb-0">
            <button
              onClick={() => router.push("/scan")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to scan
            </button>
          </div>
          <InvalidImageScreen
            result={result}
            onRetry={() => {
              sessionStorage.removeItem("PrismDX_result")
              router.push("/scan")
            }}
            onNewScan={() => {
              sessionStorage.removeItem("PrismDX_result")
              router.push("/scan")
            }}
          />
        </div>
      </TooltipProvider>
    )
  }

  // ── Normal results branch ────────────────────────────────────────────────
  const diagnosisResult = result as DiagnosisResult

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await exportResultsToPDF(diagnosisResult)
      toast.success("PDF exported successfully")
    } catch {
      toast.error("Failed to export PDF")
    } finally {
      setIsExporting(false)
    }
  }

  const handleHumanReview = () => {
    if (reviewRequested || !diagnosisResult) return
    const history = JSON.parse(localStorage.getItem("PrismDX_history") || "[]")
    const updated = history.map((e: typeof diagnosisResult & { id: string; human_review_requested?: boolean }) => {
      if (e.timestamp === diagnosisResult.timestamp) return { ...e, human_review_requested: true }
      return e
    })
    localStorage.setItem("PrismDX_history", JSON.stringify(updated))
    const updatedResult = { ...diagnosisResult, human_review_requested: true }
    sessionStorage.setItem("PrismDX_result", JSON.stringify(updatedResult))
    setReviewRequested(true)
    toast.success("Human review requested — flagged in scan history")
  }

  const riskColors = {
    low: "bg-green-100 text-green-800 border-green-200",
    moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
    high: "bg-red-100 text-red-800 border-red-200",
  }

  const formattedDate = diagnosisResult.timestamp
    ? new Date(diagnosisResult.timestamp).toLocaleString()
    : "Unknown date"

  return (
    <TooltipProvider>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <button
              onClick={() => router.push("/scan")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> New scan
            </button>
            <h1 className="text-2xl font-bold">Analysis Results</h1>
            <p className="text-muted-foreground">
              {diagnosisResult.scan_type_label} · {formattedDate} · {diagnosisResult.analysis_time_ms}ms
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={isExporting}>
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? "Exporting..." : "Export PDF"}
            </Button>
            <Button
              onClick={handleHumanReview}
              variant={diagnosisResult.has_bias_flag && !reviewRequested ? "default" : "outline"}
              disabled={reviewRequested}
              className={reviewRequested ? "opacity-60 cursor-not-allowed" : ""}
            >
              <UserCheck className="w-4 h-4 mr-2" />
              {reviewRequested ? "Review Requested ✓" : "Request Human Review"}
            </Button>
          </div>
        </div>

        {/* Bias Alert Banner */}
        {diagnosisResult.has_bias_flag && (
          <Alert className="border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive font-medium">
              <strong>Bias Flag Detected</strong> — AI confidence is below the expected threshold for this demographic.
              Human clinical review is strongly recommended before acting on this result.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Diagnosis Card */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Diagnosis
                </CardTitle>
                {diagnosisResult.finding_detected ? (
                  <Badge variant="destructive">Finding Detected</Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-800 border-green-200">No Significant Finding</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-3xl font-bold text-foreground">{diagnosisResult.condition}</p>
                <p className="text-muted-foreground mt-2 leading-relaxed">{diagnosisResult.diagnosis_summary}</p>
              </div>

              <ConfidenceBar value={diagnosisResult.confidence} baseline={diagnosisResult.baseline_confidence} />

              <div>
                <p className="text-sm font-semibold mb-3 text-foreground">Key Observations</p>
                <ul className="space-y-2">
                  {diagnosisResult.key_observations.map((obs, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      {obs}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Patient Info Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Scan Type", value: diagnosisResult.scan_type_label },
                { label: "Fitzpatrick Scale", value: diagnosisResult.fitzpatrick_label },
                ...(diagnosisResult.localization ? [{ label: "Localization", value: diagnosisResult.localization.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) }] : []),
                { label: "Age", value: diagnosisResult.age || "Not provided" },
                { label: "Gender", value: diagnosisResult.gender || "Not provided" },
                { label: "Model", value: diagnosisResult.model_version },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
                  <span className="text-sm font-medium">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Bias Evaluation */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                {diagnosisResult.has_bias_flag ? (
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                Bias Evaluation
              </CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">Based on Daneshjou et al., Nature Medicine 2024 and Seyyed-Kalantari et al., 2021</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <p className="text-2xl font-bold">{diagnosisResult.confidence.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">AI Confidence</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <p className="text-2xl font-bold">{diagnosisResult.baseline_confidence}%</p>
                <p className="text-xs text-muted-foreground mt-1">Expected Baseline</p>
              </div>
              <div className={`text-center p-4 rounded-xl border ${riskColors[diagnosisResult.bias_risk_level as keyof typeof riskColors]}`}>
                <p className="text-2xl font-bold capitalize">{diagnosisResult.bias_risk_level}</p>
                <p className="text-xs mt-1">Bias Risk Level</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{diagnosisResult.bias_explanation}</p>

            {diagnosisResult.recommendations.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-3">Recommendations</p>
                <ul className="space-y-2">
                  {diagnosisResult.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}