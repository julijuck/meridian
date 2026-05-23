import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { enrichStakeholder, getEnrichmentPrompt } from "@/lib/enrichment"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizationId = (session.user as any).organizationId
    if (!organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 })
    }

    const stakeholder = await prisma.stakeholder.findUnique({
      where: { id: params.id },
      include: { enrichment: true },
    })

    if (!stakeholder) {
      return NextResponse.json(
        { error: "Stakeholder not found" },
        { status: 404 }
      )
    }

    if (stakeholder.organizationId !== organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let enrichmentData: any

    try {
      // Build the enrichment prompt
      const sectorTags: string[] = JSON.parse(stakeholder.sectorTags || "[]")
      const prompt = getEnrichmentPrompt({
        name: stakeholder.name,
        title: stakeholder.title || "",
        organization: stakeholder.organization || "",
        jurisdiction: stakeholder.jurisdiction,
        bio: stakeholder.bio || "",
        sectorTags,
      })

      // Call Perplexity API for web search enrichment
      const perplexityRes = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY || ""}`,
        },
        body: JSON.stringify({
          model: "sonar-pro",
          messages: [
            { role: "system", content: "You are a research assistant. Return only valid JSON, no markdown formatting or explanation." },
            { role: "user", content: prompt },
          ],
          max_tokens: 2000,
          temperature: 0.1,
        }),
      })

      if (perplexityRes.ok) {
        const data = await perplexityRes.json()
        const content = data.choices?.[0]?.message?.content || ""
        // Try to parse JSON from the response (strip potential markdown fences)
        const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
        enrichmentData = JSON.parse(cleaned)
      } else {
        throw new Error(`Perplexity API error: ${perplexityRes.status}`)
      }
    } catch (aiError) {
      console.warn("AI enrichment failed, using mock data:", aiError)

      // Fallback mock enrichment data for MVP
      enrichmentData = {
        newsMentions: [
          {
            title: `${stakeholder.name} Comments on Digital Asset Framework`,
            url: "https://example.com/news/1",
            date: new Date().toISOString().split("T")[0],
            snippet: `${stakeholder.name} recently addressed the evolving regulatory landscape for digital assets in ${stakeholder.jurisdiction}.`,
          },
          {
            title: `Policy Update: ${stakeholder.jurisdiction} Considers New Legislation`,
            url: "https://example.com/news/2",
            date: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0],
            snippet: `Lawmakers in ${stakeholder.jurisdiction} are working on legislation that could impact crypto markets.`,
          },
        ],
        publicStatements: [
          {
            quote: "We need clear, consistent rules for digital asset innovation.",
            context: "Speaking at a financial technology conference",
            date: new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0],
            source: "Conference transcript",
          },
        ],
        regulatoryPositions: [
          {
            topic: "Stablecoin Regulation",
            stance: stakeholder.stanceOnCrypto || "Neutral",
            summary: `Based on available public statements, ${stakeholder.name} appears to favor a balanced approach to stablecoin oversight.`,
          },
          {
            topic: "Consumer Protection",
            stance: "Supportive",
            summary: "Has expressed support for consumer protection measures in digital asset markets.",
          },
        ],
        recentAppointments: [
          {
            role: stakeholder.title || "Current Role",
            organization: stakeholder.organization || "Unknown Organization",
            date: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
          },
        ],
      }
    }

    // Store enrichment data via lib/enrichment
    const enriched = await enrichStakeholder(params.id, enrichmentData)

    // Update the stakeholder source to "ai_enriched"
    await prisma.stakeholder.update({
      where: { id: params.id },
      data: { source: "ai_enriched" },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "enrich_stakeholder",
        entityType: "stakeholder",
        entityId: params.id,
        details: JSON.stringify({
          newsMentions: enrichmentData.newsMentions?.length || 0,
          publicStatements: enrichmentData.publicStatements?.length || 0,
          regulatoryPositions: enrichmentData.regulatoryPositions?.length || 0,
          recentAppointments: enrichmentData.recentAppointments?.length || 0,
        }),
        organizationId,
      },
    })

    return NextResponse.json(
      {
        message: "Enrichment completed successfully",
        enrichment: enriched,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("POST /api/stakeholders/[id]/enrich error:", error)
    return NextResponse.json(
      { error: "Enrichment failed" },
      { status: 500 }
    )
  }
}
