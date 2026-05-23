"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  MapPin,
  Building2,
  Calendar,
  Globe,
  Quote,
  Briefcase,
  FileText,
  Loader2,
  Pencil,
  Sparkles,
  Trash2,
  Bell,
  BellOff,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { formatDate, timeAgo } from "@/lib/utils"

interface NewsMention {
  title: string
  url: string
  date: string
  snippet: string
}

interface PublicStatement {
  quote: string
  context: string
  date: string
  source: string
}

interface RegulatoryPosition {
  topic: string
  stance: string
  summary: string
}

interface RecentAppointment {
  role: string
  organization: string
  date: string
}

interface Enrichment {
  id: string
  newsMentions: string
  publicStatements: string
  regulatoryPositions: string
  recentAppointments: string
  enrichedAt: string
}

interface Stakeholder {
  id: string
  name: string
  title: string | null
  organization: string | null
  jurisdiction: string
  sectorTags: string
  bio: string | null
  stanceOnCrypto: string | null
  source: string | null
  enrichment: Enrichment | null
  alerts: any[]
  _count: { alerts: number }
  createdAt: string
  updatedAt: string
}

const STANCE_LABELS: Record<string, { label: string; bg: string }> = {
  supportive: { label: "Supportive", bg: "bg-green-100 text-green-800 border-green-200" },
  neutral: { label: "Neutral", bg: "bg-blue-100 text-blue-800 border-blue-200" },
  hostile: { label: "Hostile", bg: "bg-red-100 text-red-800 border-red-200" },
  unknown: { label: "Unknown", bg: "bg-gray-100 text-gray-600 border-gray-200" },
}

type Tab = "news" | "statements" | "regulatory" | "appointments"

export default function StakeholderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [stakeholder, setStakeholder] = useState<Stakeholder | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("news")
  const [error, setError] = useState("")

  const fetchStakeholder = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/stakeholders/${params.id}`)
      if (res.status === 404) {
        setNotFound(true)
        return
      }
      if (!res.ok) throw new Error("Failed to load")
      const data = await res.json()
      setStakeholder(data)
    } catch (err) {
      console.error("Failed to fetch stakeholder:", err)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchStakeholder()
  }, [fetchStakeholder])

  const handleEnrich = async () => {
    setEnriching(true)
    setError("")
    try {
      const res = await fetch(`/api/stakeholders/${params.id}/enrich`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Enrichment failed")
      await fetchStakeholder()
    } catch (err: any) {
      setError(err.message || "Enrichment failed")
    } finally {
      setEnriching(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/stakeholders/${params.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete")
      router.push("/dashboard/stakeholders")
    } catch (err: any) {
      setError(err.message || "Failed to delete")
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const parseJson = (json: string): any[] => {
    try {
      return JSON.parse(json)
    } catch {
      // Prisma stores arrays as JSON strings, but the raw data might also come as an array
      return []
    }
  }

  const getSectorTags = (): string[] => {
    if (!stakeholder) return []
    return parseJson(stakeholder.sectorTags)
  }

  // Loading state
  if (loading) {
    return (
      <div className="page-shell">
        <div className="animate-pulse space-y-6">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-5 w-48 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-muted rounded-xl" />
            <div className="h-32 bg-muted rounded-xl" />
            <div className="h-32 bg-muted rounded-xl" />
          </div>
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    )
  }

  // 404 state
  if (notFound || !stakeholder) {
    return (
      <div className="page-shell">
        <div className="empty-state">
          <AlertCircle className="empty-state-icon" />
          <h3 className="empty-state-title">Stakeholder not found</h3>
          <p className="empty-state-desc">
            The stakeholder you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/dashboard/stakeholders"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Stakeholders
          </Link>
        </div>
      </div>
    )
  }

  const enrichment = stakeholder.enrichment
  const stance = STANCE_LABELS[stakeholder.stanceOnCrypto || "unknown"] || STANCE_LABELS.unknown

  return (
    <div className="page-shell">
      {/* Error toast */}
      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Back link */}
      <Link
        href="/dashboard/stakeholders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Stakeholders
      </Link>

      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="section-title">{stakeholder.name}</h1>
          {stakeholder.title && (
            <p className="text-base text-muted-foreground mt-1">{stakeholder.title}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEnrich}
            disabled={enriching}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            {enriching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {enriching ? "Enriching..." : "Enrich"}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-background px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-xl border border-border p-6 max-w-sm mx-4 shadow-lg">
            <h3 className="text-lg font-medium">Delete Stakeholder?</h3>
            <p className="text-sm text-muted-foreground mt-2">
              This will permanently delete {stakeholder.name} and all associated enrichment
              data and alerts. This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Organization */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            <Building2 className="h-3.5 w-3.5" />
            Organization
          </div>
          <p className="text-sm font-medium">
            {stakeholder.organization || "—"}
          </p>
        </div>

        {/* Jurisdiction */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            <MapPin className="h-3.5 w-3.5" />
            Jurisdiction
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-sm font-medium">
            <Globe className="h-3.5 w-3.5" />
            {stakeholder.jurisdiction}
          </span>
        </div>

        {/* Stance */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            <FileText className="h-3.5 w-3.5" />
            Crypto Stance
          </div>
          <span
            className={`inline-flex rounded-full border px-2.5 py-0.5 text-sm font-medium capitalize ${stance.bg}`}
          >
            {stance.label}
          </span>
        </div>

        {/* Status */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            <Calendar className="h-3.5 w-3.5" />
            Status
          </div>
          <div>
            <span className="text-sm font-medium capitalize">
              {stakeholder.source === "ai_enriched" ? "AI Enriched" : "Manual"}
            </span>
            {enrichment && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Last enriched {timeAgo(enrichment.enrichedAt)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sector Tags */}
      {getSectorTags().length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Sector Tags</h3>
          <div className="flex flex-wrap gap-2">
            {getSectorTags().map((tag) => (
              <span
                key={tag}
                className="inline-flex rounded-lg bg-accent px-3 py-1 text-sm text-accent-foreground font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bio */}
      {stakeholder.bio && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Bio</h3>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
              {stakeholder.bio}
            </p>
          </div>
        </div>
      )}

      {/* Enrichment Section */}
      {enrichment && (
        <div className="mb-8">
          <div className="section-header">
            <h2 className="section-title">Intelligence</h2>
            <span className="text-xs text-muted-foreground">
              Enriched {formatDate(enrichment.enrichedAt)}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border mb-6">
            {([
              ["news", "News Mentions", parseJson(enrichment.newsMentions).length],
              ["statements", "Public Statements", parseJson(enrichment.publicStatements).length],
              ["regulatory", "Regulatory Positions", parseJson(enrichment.regulatoryPositions).length],
              ["appointments", "Recent Appointments", parseJson(enrichment.recentAppointments).length],
            ] as [Tab, string, number][]).map(([tab, label, count]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === tab
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                {count > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-xs">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content: News Mentions */}
          {activeTab === "news" && (
            <div className="space-y-3">
              {parseJson(enrichment.newsMentions).length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No news mentions found
                </p>
              ) : (
                (parseJson(enrichment.newsMentions) as NewsMention[]).map((item, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-4 card-hover">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:text-primary transition-colors inline-flex items-center gap-1"
                        >
                          {item.title}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <p className="text-xs text-muted-foreground mt-1">{item.snippet}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {item.date}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab Content: Public Statements */}
          {activeTab === "statements" && (
            <div className="space-y-3">
              {parseJson(enrichment.publicStatements).length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No public statements found
                </p>
              ) : (
                (parseJson(enrichment.publicStatements) as PublicStatement[]).map((item, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-4 card-hover">
                    <div className="flex items-start gap-3">
                      <Quote className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm italic">&ldquo;{item.quote}&rdquo;</p>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {item.context} — {item.source}
                        </p>
                        <span className="text-xs text-muted-foreground">{item.date}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab Content: Regulatory Positions */}
          {activeTab === "regulatory" && (
            <div className="space-y-3">
              {parseJson(enrichment.regulatoryPositions).length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No regulatory positions recorded
                </p>
              ) : (
                (parseJson(enrichment.regulatoryPositions) as RegulatoryPosition[]).map((item, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-4 card-hover">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-medium">{item.topic}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{item.summary}</p>
                      </div>
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                          STANCE_LABELS[item.stance.toLowerCase()]?.bg || "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {item.stance}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab Content: Recent Appointments */}
          {activeTab === "appointments" && (
            <div className="space-y-3">
              {parseJson(enrichment.recentAppointments).length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No recent appointments found
                </p>
              ) : (
                (parseJson(enrichment.recentAppointments) as RecentAppointment[]).map((item, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-4 card-hover">
                    <div className="flex items-start gap-3">
                      <Briefcase className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium">{item.role}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.organization}
                        </p>
                        <span className="text-xs text-muted-foreground">{item.date}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* No enrichment yet */}
      {!enrichment && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground/70">No intelligence data yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Enrich this stakeholder to gather AI-powered intelligence from public sources.
          </p>
          <button
            onClick={handleEnrich}
            disabled={enriching}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {enriching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {enriching ? "Enriching..." : "Enrich Now"}
          </button>
        </div>
      )}
    </div>
  )
}
