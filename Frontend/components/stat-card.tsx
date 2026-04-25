import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  variant?: "default" | "alert"
}

export function StatCard({ title, value, icon: Icon, description, variant = "default" }: StatCardProps) {
  return (
    <Card className={cn(
      "border",
      variant === "alert" && "border-destructive/30 bg-destructive/5"
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn(
              "text-3xl font-bold",
              variant === "alert" ? "text-destructive" : "text-foreground"
            )}>
              {value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-lg",
            variant === "alert" ? "bg-destructive/10" : "bg-primary/10"
          )}>
            <Icon className={cn(
              "w-5 h-5",
              variant === "alert" ? "text-destructive" : "text-primary"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
