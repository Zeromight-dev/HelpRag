"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Upload, History, BookOpen, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scan", label: "New Scan", icon: Upload },
  { href: "/history", label: "History", icon: History },
  { href: "/methodology", label: "Methodology", icon: BookOpen },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen border-r border-border bg-card flex flex-col">
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Activity className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">PrismDX</h1>
            <p className="text-xs text-muted-foreground">Bias Detection</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="px-4 py-3 rounded-lg bg-muted">
          <p className="text-xs text-muted-foreground">Version 3.0.0</p>
          <p className="text-xs text-muted-foreground">Clinical Use Only</p>
        </div>
      </div>
    </aside>
  )
}
