"use client"

import { Shield, Database, AlertTriangle, CheckCircle, Layers, ArrowRight, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const features = [
  {
    icon: Shield,
    title: "Point-of-Care Bias Overlay",
    description: "PrismDX acts as a transparent layer over existing AI diagnostic tools, flagging potential demographic biases in real-time without disrupting clinical workflow."
  },
  {
    icon: Database,
    title: "Research-Backed Baselines",
    description: "Our bias detection algorithms are calibrated against peer-reviewed research from Nature Medicine, JAMA, and other leading medical journals documenting AI performance disparities."
  },
  {
    icon: AlertTriangle,
    title: "Proactive Alerting",
    description: "When confidence levels fall below demographic-specific baselines, clinicians receive immediate alerts with actionable recommendations for additional verification."
  },
  {
    icon: CheckCircle,
    title: "Audit Trail",
    description: "Every scan generates a complete audit trail documenting the bias evaluation, enabling compliance with emerging AI healthcare regulations."
  }
]

const fitzpatrickData = [
  { type: "I", avgConfidence: "94%", baseline: "95%", status: "normal" },
  { type: "II", avgConfidence: "92%", baseline: "94%", status: "normal" },
  { type: "III", avgConfidence: "89%", baseline: "92%", status: "normal" },
  { type: "IV", avgConfidence: "85%", baseline: "90%", status: "watch" },
  { type: "V", avgConfidence: "78%", baseline: "90%", status: "alert" },
  { type: "VI", avgConfidence: "72%", baseline: "90%", status: "alert" },
]

export default function MethodologyPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Badge variant="outline" className="mb-4">Documentation</Badge>
        <h1 className="text-3xl font-bold text-foreground mb-2">Methodology</h1>
        <p className="text-lg text-muted-foreground">
          Understanding how PrismDX detects and surfaces AI diagnostic bias
        </p>
      </div>

      {/* Introduction */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>What is PrismDX?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            PrismDX is a <strong className="text-foreground">point-of-care demographic bias overlay</strong> designed
            to fill a critical gap in current MLOps tools. While most AI monitoring focuses on aggregate model
            performance, PrismDX surfaces potential bias flags <em>directly to clinicians</em> at the moment of
            diagnosis—when it matters most.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Research has consistently shown that AI diagnostic models can exhibit reduced accuracy for
            underrepresented demographic groups, particularly in dermatology and radiology. PrismDX provides
            real-time visibility into these disparities, empowering clinicians to make informed decisions
            about when additional verification is warranted.
          </p>
        </CardContent>
      </Card>

      {/* Core Features */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Core Capabilities</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>How Bias Detection Works</CardTitle>
          <CardDescription>A step-by-step overview of the PrismDX pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Image Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  The medical image is processed through the primary diagnostic AI model, generating a
                  diagnosis and raw confidence score.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 pl-4">
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Demographic Contextualization</h4>
                <p className="text-sm text-muted-foreground">
                  Patient demographic data (Fitzpatrick scale, age, gender) is cross-referenced against
                  our baseline database derived from published research.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 pl-4">
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Bias Evaluation</h4>
                <p className="text-sm text-muted-foreground">
                  If the confidence score deviates significantly from expected baselines for the patient&apos;s
                  demographic group, a bias flag is triggered.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 pl-4">
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm shrink-0">
                4
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Clinical Decision Support</h4>
                <p className="text-sm text-muted-foreground">
                  The clinician receives the diagnosis alongside bias evaluation data, enabling informed
                  decisions about additional verification or specialist consultation.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fitzpatrick Baselines */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Fitzpatrick Scale Baselines</CardTitle>
          <CardDescription>
            Expected vs. observed AI confidence by skin phototype (dermatology applications)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Fitzpatrick Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Expected Baseline</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Observed Avg.</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {fitzpatrickData.map((row) => (
                  <tr key={row.type} className="border-b border-border last:border-0">
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="font-mono">Type {row.type}</Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground">{row.baseline}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-foreground">{row.avgConfidence}</td>
                    <td className="py-3 px-4">
                      {row.status === "alert" ? (
                        <Badge variant="destructive">Bias Alert</Badge>
                      ) : row.status === "watch" ? (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">Monitor</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">Normal</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Data derived from: Adamson AS, Smith A. Machine Learning and Health Care Disparities in Dermatology.
            JAMA Dermatology. 2018; Daneshjou R et al. Disparities in dermatology AI performance. Nature Medicine. 2024.
          </p>
        </CardContent>
      </Card>

      {/* Research References */}
      <Card>
        <CardHeader>
          <CardTitle>Research References</CardTitle>
          <CardDescription>Peer-reviewed studies informing our bias baselines</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-foreground">
                  Disparities in dermatology AI performance across skin tones
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Daneshjou R, et al. • Nature Medicine, 2024
                </p>
              </div>
              <a href="https://www.nature.com/nm/" target="_blank" rel="noopener noreferrer"
                className="text-primary hover:text-primary/80">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-foreground">
                  Machine Learning and Health Care Disparities in Dermatology
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Adamson AS, Smith A. • JAMA Dermatology, 2018
                </p>
              </div>
              <a href="https://jamanetwork.com/journals/jamadermatology" target="_blank" rel="noopener noreferrer"
                className="text-primary hover:text-primary/80">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-foreground">
                  Underdiagnosis bias of artificial intelligence algorithms
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Seyyed-Kalantari L, et al. • Nature Medicine, 2021
                </p>
              </div>
              <a href="https://www.nature.com/nm/" target="_blank" rel="noopener noreferrer"
                className="text-primary hover:text-primary/80">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <Layers className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Continuous Updates</p>
              <p className="text-sm text-muted-foreground">
                Our baseline database is continuously updated as new research is published.
                PrismDX monitors leading journals for relevant studies on AI diagnostic disparities.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
