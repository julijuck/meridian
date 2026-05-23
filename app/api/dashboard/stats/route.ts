import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizationId = (session.user as any).organizationId
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 })
    }

    const [totalStakeholders, activeAlerts, recentEnrichment, recentAlertHistory] = await Promise.all([
      prisma.stakeholder.count({ where: { organizationId } }),
      prisma.alert.count({ where: { organizationId, isActive: true } }),
      prisma.enrichment.findFirst({
        where: { stakeholder: { organizationId } },
        orderBy: { enrichedAt: "desc" },
        select: { enrichedAt: true },
      }),
      prisma.alertHistory.count({
        where: {
          alert: { organizationId },
          matchedAt: { gte: new Date(Date.now() - 7 * 86400000) },
        },
      }),
    ])

    return NextResponse.json({
      totalStakeholders,
      activeAlerts,
      lastEnrichment: recentEnrichment?.enrichedAt || null,
      alertsThisWeek: recentAlertHistory,
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
