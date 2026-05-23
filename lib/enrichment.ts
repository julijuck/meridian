import { prisma } from "@/lib/prisma"

interface EnrichmentResult {
  newsMentions: { title: string; url: string; date: string; snippet: string }[]
  publicStatements: { quote: string; context: string; date: string; source: string }[]
  regulatoryPositions: { topic: string; stance: string; summary: string }[]
  recentAppointments: { role: string; organization: string; date: string }[]
}

export async function enrichStakeholder(
  stakeholderId: string,
  enrichmentData: EnrichmentResult
) {
  const existing = await prisma.enrichment.findUnique({
    where: { stakeholderId },
  })

  if (existing) {
    return prisma.enrichment.update({
      where: { stakeholderId },
      data: {
        newsMentions: enrichmentData.newsMentions,
        publicStatements: enrichmentData.publicStatements,
        regulatoryPositions: enrichmentData.regulatoryPositions,
        recentAppointments: enrichmentData.recentAppointments,
        enrichedAt: new Date(),
      },
    })
  }

  return prisma.enrichment.create({
    data: {
      stakeholderId,
      ...enrichmentData,
      enrichedAt: new Date(),
    },
  })
}

export async function getEnrichmentPrompt(stakeholder: {
  name: string
  title: string
  organization: string
  jurisdiction: string
  bio: string
  sectorTags: string[]
}): Promise<string> {
  return `Research the following stakeholder and return structured intelligence:

Name: ${stakeholder.name}
Title: ${stakeholder.title}
Organization: ${stakeholder.organization}
Jurisdiction: ${stakeholder.jurisdiction}
Sectors: ${stakeholder.sectorTags.join(", ")}
Bio: ${stakeholder.bio}

Return a JSON object with:
1. "newsMentions": Recent (last 6 months) news articles mentioning this person. Array of {title, url, date, snippet}.
2. "publicStatements": Public quotes or statements on crypto/fintech regulation. Array of {quote, context, date, source}.
3. "regulatoryPositions": Their stance on key regulatory topics. Array of {topic, stance, summary}.
4. "recentAppointments": Any recent role changes or new appointments. Array of {role, organization, date}.

Format response as valid JSON only — no markdown, no explanation.`
}
