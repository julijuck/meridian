"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Bell,
  BellRing,
  Plus,
  Loader2,
  Trash2,
  X,
  Check,
  ExternalLink,
  Clock,
  Slash,
  RefreshCw,
  Hash,
  Building2,
  AlertCircle,
} from "lucide-react"
import { formatDate, timeAgo } from "@/lib/utils"

interface AlertKeyword {
  id: string
  value: string
}

interface Alert {
  id: string
  name: string
  description: string | null
  channel: string
  frequency: string
  webhookUrl: string | null
  isActive: boolean
  lastTriggeredAt: string | null
  stakeholderId: string | null
  stakeholder: { id: string; name: string } | null
  keywords: AlertKeyword[]
  _count: { history: number }
  createdAt: string
}

const CHANNEL_BADGES: Record<string, { label: string; bg: string }> = {
  SLACK: { label: "Slack", bg: "bg-purple-100 text-purple-800 border-purple-200" },
  TEAMS: { label: "Teams", bg: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  EMAIL: { label: "Email", bg: "bg-amber-100 text-amber-800 border-amber-200" },
}

const FREQUENCY_BADGES: Record<string, { label: string; bg: string }> = {
  REALTIME: { label: "Realtime", bg: "bg-green-100 text-green-800 border-green-200" },
  DAILY: { label: "Daily", bg: "bg-blue-100 text-blue-800 border-blue-200" },
  WEEKLY: { label: "Weekly", bg: "bg-gray-100 text-gray-600 border-gray-200" },
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [newAlert, setNewAlert] = useState({
    name: "",
    description: "",
    channel: "SLACK",
    frequency: "DAILY",
    webhookUrl: "",
    keywords: "",
    stakeholderId: "",
  })

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/alerts")
      if (res.ok) {
        const data = await res.json()
        setAlerts(data)
      }
    } catch (err) {
      console.error("Failed to fetch alerts:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const handleCreate = async () => {
    if (!newAlert.name.trim()) {
      setError("Alert name is required")
      return
    }
    if (!newAlert.keywords.trim()) {
      setError("At least one keyword is required")
      return
    }

    setCreating(true)
    setError("")

    try {
      const keywords = newAlert.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)

      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAlert.name.trim(),
          description: newAlert.description.trim() || undefined,
          channel: newAlert.channel,
          frequency: newAlert.frequency,
          webhookUrl: newAlert.webhookUrl.trim() || undefined,
          keywords,
          stakeholderId: newAlert.stakeholderId.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create alert")
      }

      setShowCreateModal(false)
      setNewAlert({
        name: "",
        description: "",
        channel: "SLACK",
        frequency: "DAILY",
        webhookUrl: "",
        keywords: "",
        stakeholderId: "",
      })
      fetchAlerts()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const toggleActive = async (alert: Alert) => {
    try {
      const res = await fetch(`/api/alerts/${alert.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !alert.isActive }),
      })
      if (res.ok) {
        fetchAlerts()
      }
    } catch (err) {
      console.error("Failed to toggle alert:", err)
    }
  }

  const handleDeleteAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        fetchAlerts()
      }
    } catch (err) {
      console.error("Failed to delete alert:", err)
    }
  }

  return (
    <div className="page-shell">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="section-title">Alerts</h1>
          <p className="section-subtitle">
            Monitor keywords and get notified when stakeholders are mentioned
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Alert
        </button>
      </div>

      {/* Error toast */}
      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-5 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-48 bg-muted rounded" />
                </div>
                <div className="h-5 w-16 bg-muted rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && alerts.length === 0 && (
        <div className="empty-state">
          <Bell className="empty-state-icon" />
          <h3 className="empty-state-title">No alerts configured</h3>
          <p className="empty-state-desc">
            Create alerts to monitor keywords across news sources and get notified
            via Slack, Teams, or email when your stakeholders are mentioned.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Your First Alert
          </button>
        </div>
      )}

      {/* Alert Cards */}
      {!loading && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const channelBadge = CHANNEL_BADGES[alert.channel] || CHANNEL_BADGES.SLACK
            const freqBadge = FREQUENCY_BADGES[alert.frequency] || FREQUENCY_BADGES.DAILY

            return (
              <div
                key={alert.id}
                className="rounded-xl border border-border bg-card p-5 card-hover group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  {/* Left side: alert info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`flex items-center justify-center h-10 w-10 rounded-full ${
                          alert.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {alert.isActive ? (
                          <BellRing className="h-5 w-5" />
                        ) : (
                          <Bell className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold truncate">{alert.name}</h3>
                        {alert.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {alert.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Keywords */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {alert.keywords.map((kw) => (
                        <span
                          key={kw.id}
                          className="inline-flex items-center gap-1 rounded-md bg-accent/50 px-2 py-1 text-xs font-medium"
                        >
                          <Hash className="h-3 w-3" />
                          {kw.value}
                        </span>
                      ))}
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                      {alert.stakeholder && (
                        <Link
                          href={`/dashboard/stakeholders/${alert.stakeholder.id}`}
                          className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          <Building2 className="h-3 w-3" />
                          {alert.stakeholder.name}
                        </Link>
                      )}
                      <span>{alert._count.history} match{alert._count.history !== 1 ? "es" : ""}</span>
                      {alert.lastTriggeredAt && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last triggered {timeAgo(alert.lastTriggeredAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side: badges + actions */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${channelBadge.bg}`}
                      >
                        {channelBadge.label}
                      </span>
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${freqBadge.bg}`}
                      >
                        {freqBadge.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Toggle active */}
                      <button
                        onClick={() => toggleActive(alert)}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                          alert.isActive
                            ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                        title={alert.isActive ? "Pause alert" : "Resume alert"}
                      >
                        {alert.isActive ? (
                          <>
                            <Slash className="h-3 w-3" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3" />
                            Resume
                          </>
                        )}
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/5 transition-colors"
                        title="Delete alert"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-xl border border-border p-6 max-w-lg w-full shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Create Alert</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setError("")
                }}
                className="rounded-lg p-1 hover:bg-accent transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Alert Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={newAlert.name}
                  onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                  placeholder="e.g. Stablecoin Regulation Watch"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <input
                  type="text"
                  value={newAlert.description}
                  onChange={(e) => setNewAlert({ ...newAlert, description: e.target.value })}
                  placeholder="What does this alert track?"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Keywords <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={newAlert.keywords}
                  onChange={(e) => setNewAlert({ ...newAlert, keywords: e.target.value })}
                  placeholder="e.g. stablecoin, CBDC, crypto regulation (comma-separated)"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Channel */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Channel</label>
                <select
                  value={newAlert.channel}
                  onChange={(e) => setNewAlert({ ...newAlert, channel: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                >
                  <option value="SLACK">Slack</option>
                  <option value="TEAMS">Microsoft Teams</option>
                  <option value="EMAIL">Email</option>
                </select>
              </div>

              {/* Webhook URL (for Slack/Teams) */}
              {newAlert.channel !== "EMAIL" && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Webhook URL</label>
                  <input
                    type="text"
                    value={newAlert.webhookUrl}
                    onChange={(e) => setNewAlert({ ...newAlert, webhookUrl: e.target.value })}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Frequency</label>
                <div className="flex gap-2">
                  {(["REALTIME", "DAILY", "WEEKLY"] as const).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setNewAlert({ ...newAlert, frequency: freq })}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        newAlert.frequency === freq
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      {freq === "REALTIME" ? "Realtime" : freq === "DAILY" ? "Daily" : "Weekly"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stakeholder (optional) */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Link to Stakeholder <span className="text-muted-foreground">(optional)</span>
                </label>
                <input
                  type="text"
                  value={newAlert.stakeholderId}
                  onChange={(e) => setNewAlert({ ...newAlert, stakeholderId: e.target.value })}
                  placeholder="Stakeholder ID (cuid)"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setError("")
                }}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BellRing className="h-4 w-4" />
                )}
                {creating ? "Creating..." : "Create Alert"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
