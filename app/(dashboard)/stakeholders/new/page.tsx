"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  UserPlus,
  Building2,
  MapPin,
  Hash,
  FileText,
} from "lucide-react"

const JURISDICTIONS = [
  { value: "AR", label: "Argentina" },
  { value: "BR", label: "Brazil" },
  { value: "CO", label: "Colombia" },
  { value: "MX", label: "Mexico" },
  { value: "US", label: "United States" },
]

const STANCE_OPTIONS = [
  { value: "supportive", label: "Supportive" },
  { value: "neutral", label: "Neutral" },
  { value: "hostile", label: "Hostile" },
  { value: "unknown", label: "Unknown" },
]

export default function NewStakeholderPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "",
    title: "",
    organization: "",
    jurisdiction: "",
    sectorTags: "",
    bio: "",
    stanceOnCrypto: "",
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (error) setError("")
  }

  const validate = (): boolean => {
    if (!form.name.trim()) {
      setError("Name is required")
      return false
    }
    if (!form.jurisdiction) {
      setError("Jurisdiction is required")
      return false
    }
    return true
  }

  const handleSubmit = async (enrich: boolean) => {
    if (!validate()) return

    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/stakeholders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          title: form.title.trim() || undefined,
          organization: form.organization.trim() || undefined,
          jurisdiction: form.jurisdiction,
          sectorTags: form.sectorTags,
          bio: form.bio.trim() || undefined,
          stanceOnCrypto: form.stanceOnCrypto || "unknown",
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create stakeholder")
      }

      const stakeholder = await res.json()

      if (enrich) {
        // Trigger enrichment
        await fetch(`/api/stakeholders/${stakeholder.id}/enrich`, {
          method: "POST",
        })
      }

      router.push(`/dashboard/stakeholders/${stakeholder.id}`)
    } catch (err: any) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="page-shell max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/stakeholders"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Stakeholders
        </Link>
        <h1 className="section-title">Add Stakeholder</h1>
        <p className="section-subtitle">
          Add a policymaker, regulator, or industry leader to your stakeholder map
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1.5">
            Name <span className="text-destructive">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Full name"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={submitting}
          />
        </div>

        {/* Title + Organization */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1.5">
              Title
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Senator, Director"
                className="w-full rounded-lg border border-border bg-background pl-10 pr-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={submitting}
              />
            </div>
          </div>
          <div>
            <label htmlFor="organization" className="block text-sm font-medium mb-1.5">
              Organization
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="organization"
                name="organization"
                type="text"
                value={form.organization}
                onChange={handleChange}
                placeholder="e.g. U.S. Senate"
                className="w-full rounded-lg border border-border bg-background pl-10 pr-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={submitting}
              />
            </div>
          </div>
        </div>

        {/* Jurisdiction */}
        <div>
          <label htmlFor="jurisdiction" className="block text-sm font-medium mb-1.5">
            Jurisdiction <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              id="jurisdiction"
              name="jurisdiction"
              value={form.jurisdiction}
              onChange={handleChange}
              className="w-full rounded-lg border border-border bg-background pl-10 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
              disabled={submitting}
            >
              <option value="">Select jurisdiction...</option>
              {JURISDICTIONS.map((j) => (
                <option key={j.value} value={j.value}>
                  {j.label} ({j.value})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sector Tags */}
        <div>
          <label htmlFor="sectorTags" className="block text-sm font-medium mb-1.5">
            Sector Tags
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="sectorTags"
              name="sectorTags"
              type="text"
              value={form.sectorTags}
              onChange={handleChange}
              placeholder="e.g. banking, defi, stablecoins (comma-separated)"
              className="w-full rounded-lg border border-border bg-background pl-10 pr-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={submitting}
            />
          </div>
        </div>

        {/* Stance on Crypto */}
        <div>
          <label htmlFor="stanceOnCrypto" className="block text-sm font-medium mb-1.5">
            Stance on Crypto
          </label>
          <select
            id="stanceOnCrypto"
            name="stanceOnCrypto"
            value={form.stanceOnCrypto}
            onChange={handleChange}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
            disabled={submitting}
          >
            <option value="">Select stance...</option>
            {STANCE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium mb-1.5">
            Bio
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <textarea
              id="bio"
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={4}
              placeholder="Brief background, known positions, relevant context..."
              className="w-full rounded-lg border border-border bg-background pl-10 pr-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              disabled={submitting}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Create & Enrich
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
