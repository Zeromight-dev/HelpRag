"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, AlertTriangle, CheckCircle, Download, Trash2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { type DiagnosisResult } from "@/lib/api"
import { exportResultsToPDF } from "@/lib/pdf-export"
import { toast } from "sonner"

type HistoryEntry = DiagnosisResult & { id: string; human_review_requested?: boolean }

export default function HistoryPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [search, setSearch] = useState("")
  const [filterBias, setFilterBias] = useState("all")
  const [filterScanType, setFilterScanType] = useState("all")
  const [filterRisk, setFilterRisk] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("helprag_history") || "[]")
    setEntries(stored)
  }, [])

  const filtered = useMemo(() => {
    let list = [...entries]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.condition.toLowerCase().includes(q) ||
        e.scan_type_label.toLowerCase().includes(q) ||
        e.fitzpatrick_label.toLowerCase().includes(q) ||
        (e.age && e.age.includes(q))
      )
    }

    if (filterBias !== "all") {
      list = list.filter(e =>
        filterBias === "flagged" ? e.has_bias_flag : !e.has_bias_flag
      )
    }

    if (filterScanType !== "all") {
      list = list.filter(e => e.scan_type === filterScanType)
    }

    if (filterRisk !== "all") {
      list = list.filter(e => e.bias_risk_level === filterRisk)
    }

    list.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      if (sortBy === "oldest") return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      if (sortBy === "confidence-high") return b.confidence - a.confidence
      if (sortBy === "confidence-low") return a.confidence - b.confidence
      return 0
    })

    return list
  }, [entries, search, filterBias, filterScanType, filterRisk, sortBy])

  const handleDelete = (id: string) => {
    const updated = entries.filter(e => e.id !== id)
    setEntries(updated)
    localStorage.setItem("helprag_history", JSON.stringify(updated))
    toast.success("Record deleted")
  }

  const handleView = (entry: HistoryEntry) => {
    sessionStorage.setItem("helprag_result", JSON.stringify(entry))
    router.push("/results")
  }

  const handleExport = async (entry: HistoryEntry) => {
    try {
      await exportResultsToPDF(entry)
    } catch {
      toast.error("Export failed")
    }
  }

  const handleClearAll = () => {
    if (!confirm("Delete all scan history? This cannot be undone.")) return
    setEntries([])
    localStorage.removeItem("helprag_history")
    toast.success("History cleared")
  }

  const biasCount = entries.filter(e => e.has_bias_flag).length

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Scan History</h1>
          <p className="text-muted-foreground">
            {entries.length} total scans · {biasCount} bias flags
          </p>
        </div>
        {entries.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearAll} className="text-destructive hover:text-destructive">
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />Clear All
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search condition, scan type..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterBias} onValueChange={setFilterBias}>
          <SelectTrigger className="w-40">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All results</SelectItem>
            <SelectItem value="flagged">Bias flagged</SelectItem>
            <SelectItem value="clear">No flag</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterScanType} onValueChange={setFilterScanType}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Scan type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All scan types</SelectItem>
            <SelectItem value="skin-lesion">Skin Lesion</SelectItem>
            <SelectItem value="dermoscopy">Dermoscopy</SelectItem>
            <SelectItem value="chest-xray">Chest X-ray</SelectItem>
            <SelectItem value="mammography">Mammography</SelectItem>
            <SelectItem value="ct-scan">CT Scan</SelectItem>
            <SelectItem value="mri">MRI</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterRisk} onValueChange={setFilterRisk}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Risk level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All risk levels</SelectItem>
            <SelectItem value="low">Low risk</SelectItem>
            <SelectItem value="moderate">Moderate risk</SelectItem>
            <SelectItem value="high">High risk</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="confidence-high">Highest confidence</SelectItem>
            <SelectItem value="confidence-low">Lowest confidence</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          {entries.length === 0 ? (
            <div className="space-y-3">
              <Clock className="w-10 h-10 mx-auto opacity-30" />
              <p className="font-medium">No scans yet</p>
              <p className="text-sm">Run your first scan to see history here</p>
              <Button className="mt-4" onClick={() => router.push("/scan")}>Start a Scan</Button>
            </div>
          ) : (
            <p>No results match your filters</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <Card key={entry.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: entry.has_bias_flag ? "#fee2e2" : "#dcfce7" }}>
                  {entry.has_bias_flag
                    ? <AlertTriangle className="w-4 h-4 text-destructive" />
                    : <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate">{entry.condition}</span>
                    {entry.has_bias_flag && (
                      <Badge variant="destructive" className="text-xs">Bias Flagged</Badge>
                    )}
                    {entry.human_review_requested && (
                      <Badge variant="outline" className="text-xs">Human Review</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {entry.scan_type_label} · Fitzpatrick {entry.fitzpatrick}
                    {entry.localization ? ` · ${entry.localization.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}` : ""}
                    {entry.age ? ` · Age ${entry.age}` : ""}
                    {entry.gender ? ` · ${entry.gender}` : ""}
                    {" · "}{new Date(entry.timestamp).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-sm font-semibold">{entry.confidence.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground capitalize">{entry.bias_risk_level} risk</p>
                </div>

                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => handleView(entry)}>View</Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleExport(entry)}>
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(entry.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
