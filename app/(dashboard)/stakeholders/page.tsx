"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Search,
  Plus,
  Users,
  MapPin,
  Building2,
  ExternalLink,
  Loader2,
  Filter,
} from "lucide-react"
import { formatDate, timeAgo } from "@/lib/utils"

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
  enrichment: {
    enrichedAt: string
  } | null
  _count: {
    alerts: number
  }
  createdAt: string
  updatedAt: string
}

const JURISDICTIONS = ["ALL", "AR", "BR", "CO", "MX", "US"]

const STANCE_BADGES: Record<string, string> = {
  supportive: "bg-green-100 text-green-800 border-green-200",
  neutral: "bg-blue-100 text-blue-800 border-blue-200",
  hostile: "bg-red-100 text-red-800 border-red-200",
  unknown: "bg-gray-100 text-gray-600 border-gray-200",
}

const SOURCE_BADGES: Record<string, string> = {
  ai_enriched: "bg-purple-100 text-purple-800 border-purple-200",
  manual: "bg-yellow-100 text-yellow-800 border-yellow-200",
}

export default function StakeholdersPage() {
  const router = useRouter()
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [jurisdictionFilter, setJurisdictionFilter] = useState("ALL")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchStakeholders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (jurisdictionFilter !== "ALL") params.set("jurisdiction", jurisdictionFilter)

      const res = await fetch(`/api/stakeholders?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setStakeholders(data)
      }
    } catch (error) {
      console.error("Failed to fetch stakeholders:", error)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, jurisdictionFilter])

  useEffect(() => {
    fetchStakeholders()
  }, [fetchStakeholders])

  const getSectorTags = (tagsJson: string): string[] => {
    try {
      return JSON.parse(tagsJson)
    } catch {
      return []
    }
  }

  return (
    <div className="page-shell">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="section-title">Stakeholders</h1>
          <p className="section-subtitle">
            Track and monitor key individuals shaping crypto policy
          </p>
        </div>
        <Link
          href="/dashboard/stakeholders/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Stakeholder
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, jurisdiction, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <select
            value={jurisdictionFilter}
            onChange={(e) => setJurisdictionFilter(e.target.value)}
            className="rounded-lg border border-border bg-background pl-10 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer min-w-[120px]"
          >
            {JURISDICTIONS.map((j) => (
              <option key={j} value={j}>
                {j === "ALL" ? "All Jurisdictions" : j}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-b-0 animate-pulse"
            >
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-48 bg-muted rounded" />
              </div>
              <div className="h-5 w-16 bg-muted rounded-full" />
              <div className="h-5 w-20 bg-muted rounded-full" />
              <div className="h-4 w-24 bg-muted rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && stakeholders.length === 0 && (
        <div className="empty-state">
          <Users className="empty-state-icon" />
          <h3 className="empty-state-title">No stakeholders yet</h3>
          <p className="empty-state-desc">
            Start building your stakeholder map by adding key policymakers,
            regulators, and industry leaders.
          </p>
          <Link
            href="/dashboard/stakeholders/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Your First Stakeholder
          </Link>
        </div>
      )}

      {/* Table */}
      {!loading && stakeholders.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="col-span-3">Name</div>
            <div className="col-span-3">Organization</div>
            <div className="col-span-1">Jurisdiction</div>
            <div className="col-span-1">Stance</div>
            <div className="col-span-2">Tags</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Table Body */}
          {stakeholders.map((s) => (
            <div
              key={s.id}
              onClick={() => router.push(`/dashboard/stakeholders/${s.id}`)}
              className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border last:border-b-0 hover:bg-accent/30 cursor-pointer transition-colors items-center"
            >
              {/* Name + Title */}
              <div className="col-span-3">
                <div className="font-medium text-sm text-foreground">{s.name}</div>
                {s.title && (
                  <div className="text-xs text-muted-foreground mt-0.5">{s.title}</div>
                )}
              </div>

              {/* Organization */}
              <div className="col-span-3">
                {s.organization ? (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{s.organization}</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground/50">—</span>
                )}
              </div>

              {/* Jurisdiction */}
              <div className="col-span-1">
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {s.jurisdiction}
                </span>
              </div>

              {/* Stance */}
              <div className="col-span-1">
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                    STANCE_BADGES[s.stanceOnCrypto || "unknown"] || STANCE_BADGES.unknown
                  }`}
                >
                  {s.stanceOnCrypto || "unknown"}
                </span>
              </div>

              {/* Sector Tags */}
              <div className="col-span-2">
                <div className="flex flex-wrap gap-1">
                  {getSectorTags(s.sectorTags)
                    .slice(0, 2)
                    .map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex rounded-md bg-accent px-1.5 py-0.5 text-xs text-accent-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  {getSectorTags(s.sectorTags).length > 2 && (
                    <span className="text-xs text-muted-foreground">
                      +{getSectorTags(s.sectorTags).length - 2}
                    </span>
                  )}
                </div>
              </div>

              {/* Status (enriched/manual) */}
              <div className="col-span-1">
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                    SOURCE_BADGES[s.source || "manual"] || SOURCE_BADGES.manual
                  }`}
                >
                  {s.source === "ai_enriched" ? "enriched" : "manual"}
                </span>
              </div>

              {/* Actions */}
              <div className="col-span-1 text-right">
                <div className="flex items-center justify-end gap-1">
                  {s.enrichment && (
                    <span className="text-xs text-muted-foreground" title={`Enriched ${timeAgo(s.enrichment.enrichedAt)}`}>
                      ✨
                    </span>
                  )}
                  <ExternalLink className="h-4 w-4 text-muted-foreground/50" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
