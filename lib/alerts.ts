import { prisma } from "@/lib/prisma"

export interface AlertMatch {
  stakeholderId?: string
  stakeholderName?: string
  keyword: string
  snippet: string
  source: string
  url: string
  matchedAt: Date
}

export async function processAlert(alertId: string): Promise<AlertMatch[]> {
  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
    include: {
      keywords: true,
      ...(alertId ? {} : {}),
    },
  })

  if (!alert) return []

  const matches: AlertMatch[] = []

  // This would normally call an external news/alert API
  // For MVP, we return a simulated match structure
  for (const keyword of (alert as any).keywords || []) {
    matches.push({
      keyword: keyword.value,
      snippet: `[Demo alert] Monitoring for "${keyword.value}" is active. Configure Slack webhook for live alerts.`,
      source: "Meridian Alert Engine",
      url: "https://app.meridian.ai",
      matchedAt: new Date(),
    })
  }

  // Update last triggered
  await prisma.alert.update({
    where: { id: alertId },
    data: { lastTriggeredAt: new Date() },
  })

  // Log alert history
  if (matches.length > 0) {
    await prisma.alertHistory.createMany({
      data: matches.map((m) => ({
        alertId,
        keyword: m.keyword,
        snippet: m.snippet,
        source: m.source,
        url: m.url,
        ...(m.stakeholderId ? { stakeholderId: m.stakeholderId } : {}),
      })),
    })
  }

  return matches
}

export async function sendSlackAlert(
  webhookUrl: string,
  matches: AlertMatch[]
): Promise<boolean> {
  try {
    const blocks = matches.map((m) => ({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${m.keyword}* — ${m.snippet}
_Source: ${m.source}_ | <${m.url}|View>`,
      },
    }))

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🔔 Meridian Alert — ${matches.length} new match(es)`,
        blocks,
      }),
    })

    return true
  } catch (error) {
    console.error("Slack alert send failed:", error)
    return false
  }
}

export async function sendEmailAlert(
  to: string,
  matches: AlertMatch[]
): Promise<boolean> {
  // Email sending would use SMTP or a service like Resend
  // For MVP, log and return success
  console.log(`[Email Alert] To: ${to}, Matches: ${matches.length}`)
  return true
}
