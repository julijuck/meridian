"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect, FormEvent } from "react"
import {
  User,
  Building2,
  Mail,
  Shield,
  Slack,
  MessageSquare,
  Palette,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react"

interface ExtendedUser {
  name?: string | null
  email?: string | null
  id?: string
  role?: string
  organizationId?: string
  organizationName?: string
}

interface OrgInfo {
  name: string
  plan: string
  slug: string
  createdAt: string
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const user = session?.user as ExtendedUser | undefined

  const [org, setOrg] = useState<OrgInfo | null>(null)
  const [slackWebhook, setSlackWebhook] = useState("")
  const [teamsWebhook, setTeamsWebhook] = useState("")
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [loadingOrg, setLoadingOrg] = useState(true)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const [orgRes, settingsRes] = await Promise.all([
          fetch("/api/organization"),
          fetch("/api/settings/channels"),
        ])

        if (orgRes.ok) {
          const data = await orgRes.json()
          setOrg(data)
        }

        if (settingsRes.ok) {
          const data = await settingsRes.json()
          setSlackWebhook(data.slackWebhookUrl || "")
          setTeamsWebhook(data.teamsWebhookUrl || "")
        }
      } catch {
        // Silently fail — settings are optional
      } finally {
        setLoadingOrg(false)
      }
    }

    if (user?.organizationId) {
      fetchSettings()
    }
  }, [user?.organizationId])

  async function handleSaveChannels(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSuccessMsg("")
    setErrorMsg("")

    try {
      const res = await fetch("/api/settings/channels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slackWebhookUrl: slackWebhook.trim() || null,
          teamsWebhookUrl: teamsWebhook.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save")
      }

      setSuccessMsg("Alert channels saved successfully")
      setTimeout(() => setSuccessMsg(""), 4000)
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const planBadge = (plan: string) => {
    const colors: Record<string, string> = {
      trial: "bg-amber-100 text-amber-700",
      pro: "bg-blue-100 text-blue-700",
      enterprise: "bg-purple-100 text-purple-700",
    }
    return (
      <span
        className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase ${
          colors[plan] || "bg-muted text-muted-foreground"
        }`}
      >
        {plan}
      </span>
    )
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Page header */}
      <div className="section-header">
        <div>
          <h1 className="section-title">Settings</h1>
          <p className="section-subtitle">
            Manage your profile, organization, and alert channels
          </p>
        </div>
      </div>

      {/* Success / Error messages */}
      {successMsg && (
        <div className="flex items-center gap-2.5 bg-emerald-50 text-emerald-700 rounded-lg px-4 py-3 text-sm border border-emerald-200 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2.5 bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm border border-destructive/20 animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* User Profile */}
      <section className="bg-card rounded-xl border">
        <div className="px-5 py-4 border-b">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            Profile
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center">
              <span className="text-xl font-bold text-accent-foreground">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <p className="text-lg font-semibold">{user?.name || "User"}</p>
              <p className="text-sm text-muted-foreground">{user?.role || "Member"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Mail className="w-3 h-3" />
                Email
              </label>
              <p className="text-sm">{user?.email || "—"}</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                Role
              </label>
              <p className="text-sm capitalize">{user?.role?.toLowerCase() || "—"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Organization Info */}
      <section className="bg-card rounded-xl border">
        <div className="px-5 py-4 border-b">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            Organization
          </h2>
        </div>
        <div className="p-5">
          {loadingOrg ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-5 w-48 bg-muted rounded" />
              <div className="h-4 w-32 bg-muted rounded" />
            </div>
          ) : org ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <p className="text-lg font-semibold">{org.name}</p>
                {planBadge(org.plan)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Slug
                  </label>
                  <p className="text-sm font-mono text-muted-foreground">
                    {org.slug}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Member since
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(org.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {user?.organizationName || "Organization"} — details unavailable
            </p>
          )}
        </div>
      </section>

      {/* Alert Channels */}
      <section className="bg-card rounded-xl border">
        <div className="px-5 py-4 border-b">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <BellIcon className="w-4 h-4 text-muted-foreground" />
            Alert Channels
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Configure where Meridian sends alert notifications
          </p>
        </div>
        <form onSubmit={handleSaveChannels} className="p-5 space-y-5">
          {/* Slack webhook */}
          <div className="space-y-2">
            <label
              htmlFor="slackWebhook"
              className="text-sm font-medium flex items-center gap-2"
            >
              <Slack className="w-4 h-4" />
              Slack Webhook URL
            </label>
            <input
              id="slackWebhook"
              type="url"
              value={slackWebhook}
              onChange={(e) => setSlackWebhook(e.target.value)}
              placeholder="https://hooks.slack.com/services/…"
              className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm
                placeholder:text-muted-foreground/60
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              Create a Slack webhook in your workspace settings, then paste the
              URL here.
            </p>
          </div>

          {/* Teams webhook */}
          <div className="space-y-2">
            <label
              htmlFor="teamsWebhook"
              className="text-sm font-medium flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Microsoft Teams Webhook URL
            </label>
            <input
              id="teamsWebhook"
              type="url"
              value={teamsWebhook}
              onChange={(e) => setTeamsWebhook(e.target.value)}
              placeholder="https://…webhook.office.com/webhookb2/…"
              className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm
                placeholder:text-muted-foreground/60
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              Add an incoming webhook connector in your Teams channel, then
              paste the URL here.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground
                font-medium rounded-lg px-4 py-2.5 text-sm
                hover:opacity-90 transition-opacity
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save channels
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Appearance */}
      <section className="bg-card rounded-xl border">
        <div className="px-5 py-4 border-b">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Palette className="w-4 h-4 text-muted-foreground" />
            Appearance
          </h2>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Light / Dark mode toggle — coming soon
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-xs text-muted-foreground">
              <span>Light</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function BellIcon({ className }: { className?: string }) {
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
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}
