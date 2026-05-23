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

    const alert = await prisma.alert.findUnique({
      where: { id: params.id },
      include: {
        keywords: true,
        stakeholder: { select: { id: true, name: true } },
        history: {
          take: 20,
          orderBy: { matchedAt: "desc" },
        },
        _count: { select: { history: true } },
      },
    })

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 })
    }

    if (alert.organizationId !== organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json(alert, { status: 200 })
  } catch (error) {
    console.error("GET /api/alerts/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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

    const existing = await prisma.alert.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 })
    }

    if (existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      channel,
      frequency,
      webhookUrl,
      isActive,
      keywords,
      stakeholderId,
    } = body

    const data: any = {}
    if (name !== undefined) data.name = name
    if (description !== undefined) data.description = description
    if (channel !== undefined) data.channel = channel
    if (frequency !== undefined) data.frequency = frequency
    if (webhookUrl !== undefined) data.webhookUrl = webhookUrl
    if (isActive !== undefined) data.isActive = isActive
    if (stakeholderId !== undefined) data.stakeholderId = stakeholderId || null

    // Handle keywords update
    if (keywords && Array.isArray(keywords)) {
      // Delete existing keywords and recreate
      await prisma.alertKeyword.deleteMany({ where: { alertId: params.id } })

      const alert = await prisma.alert.update({
        where: { id: params.id },
        data: {
          ...data,
          keywords: {
            create: keywords.map((kw: string) => ({ value: kw })),
          },
        },
        include: {
          keywords: true,
          stakeholder: { select: { id: true, name: true } },
          _count: { select: { history: true } },
        },
      })

      return NextResponse.json(alert, { status: 200 })
    }

    const alert = await prisma.alert.update({
      where: { id: params.id },
      data,
      include: {
        keywords: true,
        stakeholder: { select: { id: true, name: true } },
        _count: { select: { history: true } },
      },
    })

    return NextResponse.json(alert, { status: 200 })
  } catch (error) {
    console.error("PATCH /api/alerts/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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

    const existing = await prisma.alert.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 })
    }

    if (existing.organizationId !== organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Cascade will delete keywords and history
    await prisma.alert.delete({ where: { id: params.id } })

    return NextResponse.json({ message: "Alert deleted" }, { status: 200 })
  } catch (error) {
    console.error("DELETE /api/alerts/[id] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
