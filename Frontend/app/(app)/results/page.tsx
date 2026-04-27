"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle, CheckCircle, Download, UserCheck,
  Activity, Clock, ChevronRight, ArrowLeft, Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { type DiagnosisResult } from "@/lib/api"
import { exportResultsToPDF } from "@/lib/pdf-export"
import { toast } from "sonner"

function ConfidenceBar({ value, baseline }: { value: number; baseline: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">AI Confidence</span>
        <span className="font-semibold">{value.toFixed(1)}%</span>
      </div>
      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
        {/* Baseline marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-orange-400 z-10"
          style={{ left: `${baseline}%` }}
        />
        {/* Confidence fill */}
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

export default function ResultsPage() {
  const router = useRouter()
  const [result, setResult] = useState<DiagnosisResult | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [reviewRequested, setReviewRequested] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem("PrismDX_result")
    if (!stored) { router.push("/scan"); return }
    try {
      const parsed = JSON.parse(stored)
      setResult(parsed)
      // Check if human review was already requested for this result
      setReviewRequested(!!parsed.human_review_requested)
    } catch {
      router.push("/scan")
    }
  }, [router])

  if (!result) return null

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await exportResultsToPDF(result)
      toast.success("PDF exported successfully")
    } catch {
      toast.error("Failed to export PDF")
    } finally {
      setIsExporting(false)
    }
  }

  const handleHumanReview = () => {
    if (reviewRequested || !result) return
    // Update history entry with human_review_requested flag
    const history = JSON.parse(localStorage.getItem("PrismDX_history") || "[]")
    const updated = history.map((e: typeof result & { id: string; human_review_requested?: boolean }) => {
      if (e.timestamp === result.timestamp) return { ...e, human_review_requested: true }
      return e
    })
    localStorage.setItem("PrismDX_history", JSON.stringify(updated))
    // Update sessionStorage so re-viewing shows correct state
    const updatedResult = { ...result, human_review_requested: true }
    sessionStorage.setItem("PrismDX_result", JSON.stringify(updatedResult))
    setReviewRequested(true)
    toast.success("Human review requested — flagged in scan history")
  }

  const riskColors = {
    low: "bg-green-100 text-green-800 border-green-200",
    moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
    high: "bg-red-100 text-red-800 border-red-200",
  }

  const formattedDate = new Date(result.timestamp).toLocaleString()

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
              {result.scan_type_label} · {formattedDate} · {result.analysis_time_ms}ms
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={isExporting}>
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? "Exporting..." : "Export PDF"}
            </Button>
            <Button
              onClick={handleHumanReview}
              variant={result.has_bias_flag && !reviewRequested ? "default" : "outline"}
              disabled={reviewRequested}
              className={reviewRequested ? "opacity-60 cursor-not-allowed" : ""}
            >
              <UserCheck className="w-4 h-4 mr-2" />
              {reviewRequested ? "Review Requested ✓" : "Request Human Review"}
            </Button>
          </div>
        </div>

        {/* Bias Alert Banner */}
        {result.has_bias_flag && (
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
                {result.finding_detected ? (
                  <Badge variant="destructive">Finding Detected</Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-800 border-green-200">No Significant Finding</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-3xl font-bold text-foreground">{result.condition}</p>
                <p className="text-muted-foreground mt-2 leading-relaxed">{result.diagnosis_summary}</p>
              </div>

              <ConfidenceBar value={result.confidence} baseline={result.baseline_confidence} />

              <div>
                <p className="text-sm font-semibold mb-3 text-foreground">Key Observations</p>
                <ul className="space-y-2">
                  {result.key_observations.map((obs, i) => (
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
                { label: "Scan Type", value: result.scan_type_label },
                { label: "Fitzpatrick Scale", value: result.fitzpatrick_label },
                ...(result.localization ? [{ label: "Localization", value: result.localization.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) }] : []),
                { label: "Age", value: result.age || "Not provided" },
                { label: "Gender", value: result.gender || "Not provided" },
                { label: "Model", value: result.model_version },
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
                {result.has_bias_flag ? (
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
                <p className="text-2xl font-bold">{result.confidence.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">AI Confidence</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <p className="text-2xl font-bold">{result.baseline_confidence}%</p>
                <p className="text-xs text-muted-foreground mt-1">Expected Baseline</p>
              </div>
              <div className={`text-center p-4 rounded-xl border ${riskColors[result.bias_risk_level]}`}>
                <p className="text-2xl font-bold capitalize">{result.bias_risk_level}</p>
                <p className="text-xs mt-1">Bias Risk Level</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{result.bias_explanation}</p>

            {result.recommendations.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-3">Recommendations</p>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, i) => (
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
