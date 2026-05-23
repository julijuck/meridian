import { NextRequest, NextResponse } from "next/server"
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

    const alerts = await prisma.alert.findMany({
      where: { organizationId, stakeholderId: null },
      select: { id: true, name: true, channel: true, webhookUrl: true, isActive: true },
    })

    // Find default Slack and Teams webhooks
    const slackAlert = alerts.find((a) => a.channel === "SLACK")
    const teamsAlert = alerts.find((a) => a.channel === "TEAMS")

    return NextResponse.json({
      slackWebhookUrl: slackAlert?.webhookUrl || "",
      teamsWebhookUrl: teamsAlert?.webhookUrl || "",
    })
  } catch (error) {
    console.error("Settings channels error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizationId = (session.user as any).organizationId
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 })
    }

    const { slackWebhookUrl, teamsWebhookUrl } = await request.json()

    // Upsert Slack channel alert
    if (slackWebhookUrl !== undefined) {
      const existing = await prisma.alert.findFirst({
        where: { organizationId, channel: "SLACK", stakeholderId: null },
      })
      if (existing) {
        await prisma.alert.update({
          where: { id: existing.id },
          data: { webhookUrl: slackWebhookUrl, isActive: !!slackWebhookUrl },
        })
      } else if (slackWebhookUrl) {
        await prisma.alert.create({
          data: {
            name: "Slack Alerts",
            channel: "SLACK",
            frequency: "DAILY",
            webhookUrl: slackWebhookUrl,
            organizationId,
          },
        })
      }
    }

    // Upsert Teams channel alert
    if (teamsWebhookUrl !== undefined) {
      const existing = await prisma.alert.findFirst({
        where: { organizationId, channel: "TEAMS", stakeholderId: null },
      })
      if (existing) {
        await prisma.alert.update({
          where: { id: existing.id },
          data: { webhookUrl: teamsWebhookUrl, isActive: !!teamsWebhookUrl },
        })
      } else if (teamsWebhookUrl) {
        await prisma.alert.create({
          data: {
            name: "Teams Alerts",
            channel: "TEAMS",
            frequency: "DAILY",
            webhookUrl: teamsWebhookUrl,
            organizationId,
          },
        })
      }
    }

    return NextResponse.json({ message: "Channel settings updated" })
  } catch (error) {
    console.error("Settings channels update error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
