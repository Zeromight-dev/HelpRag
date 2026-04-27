"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, Activity, BarChart3, CheckCircle, ArrowRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { type DiagnosisResult } from "@/lib/api"

type HistoryEntry = DiagnosisResult & { id: string }

const FITZPATRICK_BASELINES: Record<string, number> = {
  "1": 94, "2": 93, "3": 90, "4": 86, "5": 78, "6": 71
}

export default function DashboardPage() {
  const router = useRouter()
  const [history, setHistory] = useState<HistoryEntry[]>([])

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("PrismDX_history") || "[]")
    setHistory(stored)
  }, [])

  const biasCount = history.filter(e => e.has_bias_flag).length
  const avgConfidence = history.length
    ? (history.reduce((sum, e) => sum + e.confidence, 0) / history.length).toFixed(1)
    : "—"

  // Build confidence-by-Fitzpatrick chart data
  const fitzGroups: Record<string, number[]> = {}
  history.forEach(e => {
    if (!fitzGroups[e.fitzpatrick]) fitzGroups[e.fitzpatrick] = []
    fitzGroups[e.fitzpatrick].push(e.confidence)
  })

  const chartData = [1, 2, 3, 4, 5, 6].map(n => {
    const key = String(n)
    const confs = fitzGroups[key] || []
    const avg = confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length : null
    return {
      name: `Type ${n}`,
      confidence: avg ? Math.round(avg) : null,
      baseline: FITZPATRICK_BASELINES[key],
      hasBias: avg !== null && avg < FITZPATRICK_BASELINES[key],
    }
  })

  const recentScans = history.slice(0, 5)

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">AI diagnostic bias monitoring overview</p>
        </div>
        <Button asChild>
          <Link href="/scan">
            <Plus className="w-4 h-4 mr-2" />New Scan
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{history.length}</p>
                <p className="text-xs text-muted-foreground">Total Scans</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{biasCount}</p>
                <p className="text-xs text-muted-foreground">Bias Flags</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgConfidence}%</p>
                <p className="text-xs text-muted-foreground">Avg Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {history.length > 0 ? `${(((history.length - biasCount) / history.length) * 100).toFixed(0)}%` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Clear Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Confidence by Fitzpatrick Type</CardTitle>
            <p className="text-xs text-muted-foreground">Bars = your scans · Dashed = published baseline</p>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                Run scans to see data here
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barSize={32}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, "Avg Confidence"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="confidence" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.confidence === null ? "#e2e8f0" : entry.hasBias ? "#dc2626" : "#2563eb"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Scans */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Scans</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push("/history")}>
              View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentScans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm space-y-3">
                <p>No scans yet</p>
                <Button size="sm" onClick={() => router.push("/scan")}>Run your first scan</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentScans.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => {
                      sessionStorage.setItem("PrismDX_result", JSON.stringify(entry))
                      router.push("/results")
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/60 transition-colors text-left"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${entry.has_bias_flag ? "bg-destructive" : "bg-green-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{entry.condition}</p>
                      <p className="text-xs text-muted-foreground">{entry.scan_type_label} · {new Date(entry.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{entry.confidence.toFixed(1)}%</p>
                      {entry.has_bias_flag && <Badge variant="destructive" className="text-xs">Flagged</Badge>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
