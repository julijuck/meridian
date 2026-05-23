"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Users,
  Bell,
  Zap,
  AlertTriangle,
  Plus,
  ArrowRight,
  ExternalLink,
  TrendingUp,
  Activity,
  Calendar,
} from "lucide-react"
import { formatDate } from "@/lib/utils"

interface ExtendedUser {
  name?: string | null
  email?: string | null
  organizationId?: string
  organizationName?: string
  role?: string
}

interface StakeholderItem {
  id: string
  name: string
  title?: string
  organization?: string
  jurisdiction: string
  stanceOnCrypto?: string
  createdAt: string
}

interface AlertItem {
  id: string
  name: string
  channel: string
  frequency: string
  isActive: boolean
  lastTriggeredAt?: string
  createdAt: string
}

interface DashboardStats {
  totalStakeholders: number
  activeAlerts: number
  lastEnrichment: string | null
  alertsThisWeek: number
}

function StatCard({
  label,
  value,
  icon: Icon,
  sublabel,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  sublabel?: string
}) {
  return (
    <div className="bg-card rounded-xl border p-5 card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
          {sublabel && (
            <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
          )}
        </div>
        <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
          <Icon className="w-4 h-4 text-accent-foreground" />
        </div>
      </div>
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-7 w-12 bg-muted rounded" />
          <div className="h-3 w-20 bg-muted rounded" />
        </div>
        <div className="w-9 h-9 rounded-lg bg-muted" />
      </div>
    </div>
  )
}

function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-muted" />
      <div className="flex-1 space-y-1.5">
        <div className="h-4 w-36 bg-muted rounded" />
        <div className="h-3 w-24 bg-muted rounded" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const user = session?.user as ExtendedUser | undefined

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [stakeholders, setStakeholders] = useState<StakeholderItem[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [statsRes, stakeholdersRes, alertsRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/stakeholders?limit=5"),
          fetch("/api/alerts?limit=5"),
        ])

        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats(data)
        }

        if (stakeholdersRes.ok) {
          const data = await stakeholdersRes.json()
          setStakeholders(data.stakeholders || data)
        }

        if (alertsRes.ok) {
          const data = await alertsRes.json()
          setAlerts(data.alerts || data)
        }
      } catch {
        setError("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  const stanceBadge = (stance?: string) => {
    const colors: Record<string, string> = {
      supportive: "bg-emerald-100 text-emerald-700",
      neutral: "bg-slate-100 text-slate-600",
      hostile: "bg-red-100 text-red-700",
      unknown: "bg-muted text-muted-foreground",
    }
    return (
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          colors[stance || "unknown"]
        }`}
      >
        {stance || "unknown"}
      </span>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="section-header">
        <div>
          <h1 className="section-title">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="section-subtitle">
            {user?.organizationName
              ? `${user.organizationName} — Stakeholder overview`
              : "Stakeholder overview"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/stakeholders/new"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground
              font-medium rounded-lg px-4 py-2 text-sm
              hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Stakeholder
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Total Stakeholders"
              value={stats?.totalStakeholders ?? 0}
              icon={Users}
              sublabel="Across all jurisdictions"
            />
            <StatCard
              label="Active Alerts"
              value={stats?.activeAlerts ?? 0}
              icon={Bell}
              sublabel="Monitoring live"
            />
            <StatCard
              label="Last Enrichment"
              value={
                stats?.lastEnrichment
                  ? formatDate(stats.lastEnrichment)
                  : "Never"
              }
              icon={Zap}
              sublabel="AI data refresh"
            />
            <StatCard
              label="Alerts This Week"
              value={stats?.alertsThisWeek ?? 0}
              icon={TrendingUp}
              sublabel="Matches triggered"
            />
          </>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2.5 bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm border border-destructive/20">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Recent stakeholders + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Stakeholders */}
        <div className="bg-card rounded-xl border">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Recent Stakeholders
            </h2>
            <Link
              href="/dashboard/stakeholders"
              className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y">
            {loading ? (
              <>
                <ListItemSkeleton />
                <ListItemSkeleton />
                <ListItemSkeleton />
              </>
            ) : stakeholders.length === 0 ? (
              <div className="py-10 text-center">
                <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No stakeholders yet
                </p>
                <Link
                  href="/dashboard/stakeholders/new"
                  className="text-xs text-primary font-medium hover:underline mt-1 inline-block"
                >
                  Add your first stakeholder
                </Link>
              </div>
            ) : (
              stakeholders.map((s) => (
                <Link
                  key={s.id}
                  href={`/dashboard/stakeholders/${s.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-accent-foreground">
                      {s.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {s.name}
                      </p>
                      {stanceBadge(s.stanceOnCrypto)}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {s.title}
                      {s.organization ? ` at ${s.organization}` : ""} ·{" "}
                      {s.jurisdiction}
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-card rounded-xl border">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4 text-muted-foreground" />
              Recent Alerts
            </h2>
            <Link
              href="/dashboard/alerts"
              className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y">
            {loading ? (
              <>
                <ListItemSkeleton />
                <ListItemSkeleton />
                <ListItemSkeleton />
              </>
            ) : alerts.length === 0 ? (
              <div className="py-10 text-center">
                <Activity className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No alerts yet</p>
                <Link
                  href="/dashboard/alerts/new"
                  className="text-xs text-primary font-medium hover:underline mt-1 inline-block"
                >
                  Create your first alert
                </Link>
              </div>
            ) : (
              alerts.map((a) => (
                <Link
                  key={a.id}
                  href={`/dashboard/alerts/${a.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors group"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      a.isActive
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {a.isActive ? (
                      <Activity className="w-4 h-4" />
                    ) : (
                      <Calendar className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {a.name}
                      </p>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          a.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {a.isActive ? "Active" : "Paused"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {a.channel} · {a.frequency.toLowerCase()}
                      {a.lastTriggeredAt
                        ? ` · Last triggered ${formatDate(a.lastTriggeredAt)}`
                        : " · Not yet triggered"}
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Quick actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/dashboard/stakeholders/new"
            className="flex items-center gap-3 px-4 py-3.5 bg-card rounded-xl border card-hover group"
          >
            <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
              <Plus className="w-4 h-4 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium group-hover:text-primary transition-colors">
                Add Stakeholder
              </p>
              <p className="text-xs text-muted-foreground">
                Track a new contact
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/alerts/new"
            className="flex items-center gap-3 px-4 py-3.5 bg-card rounded-xl border card-hover group"
          >
            <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
              <Bell className="w-4 h-4 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium group-hover:text-primary transition-colors">
                Create Alert
              </p>
              <p className="text-xs text-muted-foreground">
                Monitor keywords
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-4 py-3.5 bg-card rounded-xl border card-hover group"
          >
            <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
              <SettingsIcon className="w-4 h-4 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium group-hover:text-primary transition-colors">
                Configure Alerts
              </p>
              <p className="text-xs text-muted-foreground">
                Set up channels
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
