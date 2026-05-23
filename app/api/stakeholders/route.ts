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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const jurisdiction = searchParams.get("jurisdiction") || ""

    const where: any = { organizationId }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sectorTags: { contains: search } },
        { organization: { contains: search } },
      ]
    }

    if (jurisdiction) {
      where.jurisdiction = jurisdiction.toUpperCase()
    }

    const stakeholders = await prisma.stakeholder.findMany({
      where,
      include: {
        enrichment: true,
        _count: {
          select: { alerts: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(stakeholders, { status: 200 })
  } catch (error) {
    console.error("GET /api/stakeholders error:", error)
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
      title,
      organization,
      jurisdiction,
      sectorTags,
      bio,
      stanceOnCrypto,
    } = body

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    if (!jurisdiction) {
      return NextResponse.json(
        { error: "Jurisdiction is required" },
        { status: 400 }
      )
    }

    // Parse sectorTags: accept string or array
    let tagsStr = "[]"
    if (Array.isArray(sectorTags)) {
      tagsStr = JSON.stringify(sectorTags)
    } else if (typeof sectorTags === "string") {
      // If it's a comma-separated string, split and trim
      if (sectorTags.trim()) {
        tagsStr = JSON.stringify(
          sectorTags.split(",").map((t: string) => t.trim()).filter(Boolean)
        )
      }
    }

    const stakeholder = await prisma.stakeholder.create({
      data: {
        name,
        title: title || null,
        organization: organization || null,
        jurisdiction: jurisdiction.toUpperCase(),
        sectorTags: tagsStr,
        bio: bio || null,
        stanceOnCrypto: stanceOnCrypto || "unknown",
        source: "manual",
        organizationId,
      },
      include: {
        enrichment: true,
        _count: {
          select: { alerts: true },
        },
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "create_stakeholder",
        entityType: "stakeholder",
        entityId: stakeholder.id,
        details: JSON.stringify({ name, jurisdiction }),
        organizationId,
      },
    })

    return NextResponse.json(stakeholder, { status: 201 })
  } catch (error) {
    console.error("POST /api/stakeholders error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
