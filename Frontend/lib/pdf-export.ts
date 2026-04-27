import { type DiagnosisResult } from "./api"

export async function exportResultsToPDF(result: DiagnosisResult): Promise<void> {
  const win = window.open("", "_blank", "width=800,height=900")
  if (!win) throw new Error("Popup blocked — please allow popups to export PDF")

  const biasColor = result.has_bias_flag
    ? "#dc2626"
    : result.bias_risk_level === "moderate"
      ? "#d97706"
      : "#16a34a"

  const biasLabel = result.has_bias_flag
    ? "⚠ BIAS FLAG DETECTED"
    : result.bias_risk_level === "moderate"
      ? "⚡ MODERATE RISK"
      : "✓ NO BIAS DETECTED"

  const formattedDate = new Date(result.timestamp).toLocaleString()
  const deviation = result.confidence_deviation >= 0
    ? `+${result.confidence_deviation.toFixed(1)}%`
    : `${result.confidence_deviation.toFixed(1)}%`

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>PrismDX Diagnostic Report — ${result.condition}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      color: #111;
      background: #fff;
      padding: 48px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 24px;
      border-bottom: 2px solid #1d4ed8;
      margin-bottom: 28px;
    }
    .logo { font-size: 22px; font-weight: 800; color: #1d4ed8; letter-spacing: -0.5px; }
    .logo span { color: #64748b; font-weight: 400; }
    .meta { text-align: right; color: #64748b; font-size: 11px; line-height: 1.7; }
    h2 { font-size: 15px; font-weight: 700; color: #111; margin-bottom: 12px; margin-top: 24px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
    }
    .card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin-bottom: 4px; }
    .card-value { font-size: 15px; font-weight: 700; color: #111; }
    .card-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .condition { font-size: 28px; font-weight: 800; color: #111; margin-bottom: 6px; }
    .summary { color: #475569; line-height: 1.6; margin-bottom: 16px; }
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    .badge-finding { background: #fee2e2; color: #dc2626; }
    .badge-clear { background: #dcfce7; color: #16a34a; }
    ul { padding-left: 18px; }
    li { margin-bottom: 5px; color: #475569; line-height: 1.5; }
    .bias-banner {
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 20px;
      border-left: 4px solid ${biasColor};
      background: ${result.has_bias_flag ? "#fef2f2" : result.bias_risk_level === "moderate" ? "#fffbeb" : "#f0fdf4"};
    }
    .bias-banner-title { font-weight: 700; color: ${biasColor}; font-size: 14px; margin-bottom: 6px; }
    .bias-banner-text { color: #475569; line-height: 1.5; }
    .confidence-bar-wrap { margin: 12px 0; }
    .confidence-bar-bg { height: 10px; background: #e2e8f0; border-radius: 999px; overflow: visible; position: relative; }
    .confidence-bar-fill {
      height: 100%;
      border-radius: 999px;
      background: ${result.confidence >= result.baseline_confidence ? "#16a34a" : "#dc2626"};
      width: ${result.confidence}%;
    }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 24px; }
      @page { margin: 0.5in; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">PrismDX <span>Diagnostic Report</span></div>
      <div style="margin-top:6px;font-size:11px;color:#64748b">${biasLabel}</div>
    </div>
    <div class="meta">
      <div><strong>Generated:</strong> ${formattedDate}</div>
      <div><strong>Model:</strong> ${result.model_version}</div>
      <div><strong>Analysis time:</strong> ${result.analysis_time_ms}ms</div>
    </div>
  </div>

  <h2>Patient Information</h2>
  <div class="grid-2">
    <div class="card"><div class="card-label">Scan Type</div><div class="card-value">${result.scan_type_label}</div></div>
    <div class="card"><div class="card-label">Fitzpatrick Scale</div><div class="card-value">${result.fitzpatrick_label}</div></div>
    <div class="card"><div class="card-label">Age</div><div class="card-value">${result.age || "Not provided"}</div></div>
    <div class="card"><div class="card-label">Gender</div><div class="card-value">${result.gender || "Not provided"}</div></div>
  </div>

  <h2>Diagnosis</h2>
  <div class="condition">${result.condition}</div>
  <div class="badge ${result.finding_detected ? "badge-finding" : "badge-clear"}">
    ${result.finding_detected ? "Finding Detected" : "No Significant Finding"}
  </div>
  <p class="summary">${result.diagnosis_summary}</p>

  <div class="confidence-bar-wrap">
    <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:11px;color:#64748b">
      <span>AI Confidence</span><span><strong>${result.confidence.toFixed(1)}%</strong> (Baseline: ${result.baseline_confidence}%)</span>
    </div>
    <div class="confidence-bar-bg">
      <div class="confidence-bar-fill"></div>
    </div>
  </div>

  ${result.key_observations.length ? `
  <div style="margin-top:16px">
    <strong style="font-size:12px">Key Observations:</strong>
    <ul style="margin-top:6px">${result.key_observations.map(o => `<li>${o}</li>`).join("")}</ul>
  </div>` : ""}

  <h2>Bias Evaluation</h2>
  <div class="bias-banner">
    <div class="bias-banner-title">${biasLabel}</div>
    <div class="bias-banner-text">${result.bias_explanation}</div>
  </div>

  <div class="grid-3">
    <div class="card">
      <div class="card-label">AI Confidence</div>
      <div class="card-value">${result.confidence.toFixed(1)}%</div>
    </div>
    <div class="card">
      <div class="card-label">Expected Baseline</div>
      <div class="card-value">${result.baseline_confidence}%</div>
    </div>
    <div class="card">
      <div class="card-label">Deviation</div>
      <div class="card-value" style="color:${biasColor}">${deviation}</div>
      <div class="card-sub" style="text-transform:capitalize">Risk: ${result.bias_risk_level}</div>
    </div>
  </div>

  ${result.recommendations.length ? `
  <div style="margin-top:20px">
    <strong style="font-size:12px">Recommendations:</strong>
    <ul style="margin-top:8px">${result.recommendations.map(r => `<li>${r}</li>`).join("")}</ul>
  </div>` : ""}

  <div class="footer">
    <span>PrismDX v2.5.0 — AI Diagnostic Bias Detection Tool</span>
    <span>For clinical use with qualified medical oversight only. Not a substitute for professional diagnosis.</span>
  </div>

  <script>
    window.onload = () => {
      setTimeout(() => { window.print(); }, 300);
    }
  </script>
</body>
</html>`

  win.document.write(html)
  win.document.close()
}
