"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

const confidenceData = [
  { tone: "Type I", confidence: 94, fill: "hsl(var(--chart-1))" },
  { tone: "Type II", confidence: 92, fill: "hsl(var(--chart-1))" },
  { tone: "Type III", confidence: 89, fill: "hsl(var(--chart-2))" },
  { tone: "Type IV", confidence: 85, fill: "hsl(var(--chart-2))" },
  { tone: "Type V", confidence: 78, fill: "hsl(var(--chart-5))" },
  { tone: "Type VI", confidence: 72, fill: "hsl(var(--chart-5))" },
]

export function ConfidenceChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Confidence by Fitzpatrick Skin Tone</CardTitle>
        <CardDescription>
          Average diagnostic confidence across skin tone demographics (Nature Medicine 2024 baselines)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={confidenceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="tone" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
                formatter={(value: number) => [`${value}%`, 'Confidence']}
              />
              <Bar dataKey="confidence" radius={[4, 4, 0, 0]}>
                {confidenceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary" />
            <span>Normal Range (85%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-destructive" />
            <span>Bias Alert (&lt;85%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
