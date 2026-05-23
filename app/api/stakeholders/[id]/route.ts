import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
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
      include: {
        enrichment: true,
        alerts: {
          include: {
            keywords: true,
          },
        },
        _count: {
          select: { alerts: true },
        },
      },
    })

    if (!stakeholder) {
      return NextResponse.json(
        { error: "Stakeholder not found" },
        { status: 404 }
      )
    }

    // Verify stakeholder belongs to user's org
    if (stakeholder.organizationId !== organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json(stakeholder, { status: 200 })
  } catch (error) {
    console.error("GET /api/stakeholders/[id] error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    // Verify stakeholder exists and belongs to org
    const existing = await prisma.stakeholder.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Stakeholder not found" },
        { status: 404 }
      )
    }

    if (existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
      source,
    } = body

    const data: any = {}

    if (name !== undefined) data.name = name
    if (title !== undefined) data.title = title
    if (organization !== undefined) data.organization = organization
    if (jurisdiction !== undefined) data.jurisdiction = jurisdiction.toUpperCase()
    if (bio !== undefined) data.bio = bio
    if (stanceOnCrypto !== undefined) data.stanceOnCrypto = stanceOnCrypto
    if (source !== undefined) data.source = source

    // Parse sectorTags: accept string[] or comma-separated string
    if (sectorTags !== undefined) {
      if (Array.isArray(sectorTags)) {
        data.sectorTags = JSON.stringify(sectorTags)
      } else if (typeof sectorTags === "string") {
        if (sectorTags.trim()) {
          data.sectorTags = JSON.stringify(
            sectorTags.split(",").map((t: string) => t.trim()).filter(Boolean)
          )
        } else {
          data.sectorTags = "[]"
        }
      }
    }

    const stakeholder = await prisma.stakeholder.update({
      where: { id: params.id },
      data,
      include: {
        enrichment: true,
        alerts: {
          include: {
            keywords: true,
          },
        },
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "update_stakeholder",
        entityType: "stakeholder",
        entityId: stakeholder.id,
        details: JSON.stringify(Object.keys(data)),
        organizationId,
      },
    })

    return NextResponse.json(stakeholder, { status: 200 })
  } catch (error) {
    console.error("PATCH /api/stakeholders/[id] error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Verify stakeholder exists and belongs to org
    const existing = await prisma.stakeholder.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Stakeholder not found" },
        { status: 404 }
      )
    }

    if (existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Cascade delete: Prisma is configured with onDelete: Cascade for enrichment and alerts
    await prisma.stakeholder.delete({
      where: { id: params.id },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "delete_stakeholder",
        entityType: "stakeholder",
        entityId: params.id,
        details: JSON.stringify({ name: existing.name }),
        organizationId,
      },
    })

    return NextResponse.json({ message: "Stakeholder deleted" }, { status: 200 })
  } catch (error) {
    console.error("DELETE /api/stakeholders/[id] error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
