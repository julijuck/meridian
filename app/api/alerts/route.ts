import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizationId = (session.user as any).organizationId
    if (!organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 })
    }

    const alerts = await prisma.alert.findMany({
      where: { organizationId },
      include: {
        keywords: true,
        stakeholder: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { history: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(alerts, { status: 200 })
  } catch (error) {
    console.error("GET /api/alerts error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizationId = (session.user as any).organizationId
    if (!organizationId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 })
    }

    const body = await request.json()
    const {
      name,
      description,
      channel,
      frequency,
      webhookUrl,
      keywords,
      stakeholderId,
    } = body

    if (!name) {
      return NextResponse.json(
        { error: "Alert name is required" },
        { status: 400 }
      )
    }

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: "At least one keyword is required" },
        { status: 400 }
      )
    }

    // Validate channel
    const validChannels = ["SLACK", "TEAMS", "EMAIL"]
    if (channel && !validChannels.includes(channel)) {
      return NextResponse.json(
        { error: `Channel must be one of: ${validChannels.join(", ")}` },
        { status: 400 }
      )
    }

    // Validate frequency
    const validFrequencies = ["REALTIME", "DAILY", "WEEKLY"]
    if (frequency && !validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { error: `Frequency must be one of: ${validFrequencies.join(", ")}` },
        { status: 400 }
      )
    }

    // If stakeholderId provided, verify it belongs to the org
    if (stakeholderId) {
      const stakeholder = await prisma.stakeholder.findUnique({
        where: { id: stakeholderId },
      })
      if (!stakeholder || stakeholder.organizationId !== organizationId) {
        return NextResponse.json(
          { error: "Stakeholder not found" },
          { status: 404 }
        )
      }
    }

    const alert = await prisma.alert.create({
      data: {
        name,
        description: description || null,
        channel: channel || "SLACK",
        frequency: frequency || "DAILY",
        webhookUrl: webhookUrl || null,
        stakeholderId: stakeholderId || null,
        organizationId,
        keywords: {
          create: keywords.map((kw: string) => ({ value: kw })),
        },
      },
      include: {
        keywords: true,
        stakeholder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "create_alert",
        entityType: "alert",
        entityId: alert.id,
        details: JSON.stringify({ name, channel: alert.channel, keywordCount: keywords.length }),
        organizationId,
      },
    })

    return NextResponse.json(alert, { status: 201 })
  } catch (error) {
    console.error("POST /api/alerts error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
