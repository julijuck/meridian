import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("\n🌱 Seeding Meridian database...\n")

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { slug: "demo-corp" },
    update: {},
    create: {
      name: "Demo Corp",
      slug: "demo-corp",
      plan: "trial",
    },
  })
  console.log(`✅ Organization: ${org.name} (${org.slug})`)

  // Create demo user
  const passwordHash = await bcrypt.hash("demo1234", 12)
  const user = await prisma.user.upsert({
    where: { email: "demo@meridian.app" },
    update: {},
    create: {
      email: "demo@meridian.app",
      name: "Demo User",
      passwordHash,
      role: "ADMIN",
      organizationId: org.id,
    },
  })
  console.log(`✅ User: ${user.email} (password: demo1234)`)

  // Create sample stakeholders
  const stakeholders = [
    {
      name: "María Elena García",
      title: "Director of Financial Innovation",
      organization: "Banco Central de Argentina",
      jurisdiction: "AR",
      sectorTags: JSON.stringify(["fintech", "central-banking", "regulation"]),
      bio: "Leading Argentina's CBDC pilot program and digital payments modernization.",
      stanceOnCrypto: "supportive",
      source: "manual",
      organizationId: org.id,
    },
    {
      name: "Carlos Mendes Silva",
      title: "Head of Digital Assets Division",
      organization: "Comissão de Valores Mobiliários (CVM)",
      jurisdiction: "BR",
      sectorTags: JSON.stringify(["securities", "crypto-regulation", "fintech"]),
      bio: "Architect of Brazil's crypto regulatory framework. Former fintech founder.",
      stanceOnCrypto: "supportive",
      source: "manual",
      organizationId: org.id,
    },
    {
      name: "Alejandra Ruiz",
      title: "Senator, Chair — Financial Technology Subcommittee",
      organization: "Senado de México",
      jurisdiction: "MX",
      sectorTags: JSON.stringify(["legislation", "fintech", "consumer-protection"]),
      bio: "Author of Mexico's Fintech Law amendments. Progressive voice on digital assets.",
      stanceOnCrypto: "neutral",
      source: "manual",
      organizationId: org.id,
    },
    {
      name: "Daniel Ortega",
      title: "Superintendent of Financial Services",
      organization: "Superintendencia Financiera de Colombia",
      jurisdiction: "CO",
      sectorTags: JSON.stringify(["banking", "regulation", "aml"]),
      bio: "Overseeing Colombia's sandbox program for crypto exchanges and DeFi platforms.",
      stanceOnCrypto: "neutral",
      source: "manual",
      organizationId: org.id,
    },
    {
      name: "Sarah Chen",
      title: "Commissioner",
      organization: "U.S. Securities and Exchange Commission",
      jurisdiction: "US",
      sectorTags: JSON.stringify(["securities", "enforcement", "crypto"]),
      bio: "Key voice on digital asset classification. Advocated for clearer token guidance.",
      stanceOnCrypto: "hostile",
      source: "manual",
      organizationId: org.id,
    },
  ]

  for (const s of stakeholders) {
    const stakeholder = await prisma.stakeholder.upsert({
      where: { id: s.name }, // won't match, always creates
      update: {},
      create: s,
    })
    console.log(`✅ Stakeholder: ${stakeholder.name} (${stakeholder.jurisdiction})`)

    // Create enrichment data for each
    await prisma.enrichment.upsert({
      where: { stakeholderId: stakeholder.id },
      update: {},
      create: {
        stakeholderId: stakeholder.id,
        newsMentions: JSON.stringify([
          {
            title: `${stakeholder.name} Discusses Digital Asset Regulation`,
            url: "https://example.com/news/1",
            date: new Date().toISOString().split("T")[0],
            snippet: `${stakeholder.name} recently addressed the evolving regulatory landscape for crypto assets.`,
          },
          {
            title: `Industry Reacts to Latest ${stakeholder.jurisdiction} Policy Update`,
            url: "https://example.com/news/2",
            date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
            snippet: `Policy developments in ${stakeholder.jurisdiction} signal changing approach to digital assets.`,
          },
        ]),
        publicStatements: JSON.stringify([
          {
            quote: "We must balance innovation with consumer protection.",
            context: "Speaking at Fintech Summit 2026",
            date: new Date(Date.now() - 10 * 86400000).toISOString().split("T")[0],
            source: "Conference recording",
          },
        ]),
        regulatoryPositions: JSON.stringify([
          {
            topic: "Stablecoin Oversight",
            stance: stakeholder.stanceOnCrypto,
            summary: `Based on public record, ${stakeholder.name} has expressed ${stakeholder.stanceOnCrypto} views toward digital asset regulation.`,
          },
          {
            topic: "Licensing Framework",
            stance: "Moderate",
            summary: "Favors a tiered licensing approach for crypto service providers.",
          },
        ]),
        recentAppointments: JSON.stringify([
          {
            role: stakeholder.title,
            organization: stakeholder.organization,
            date: new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0],
          },
        ]),
        enrichedAt: new Date(),
      },
    })
  }

  // Create sample alerts
  const alerts = [
    {
      name: "Argentina CBDC News",
      channel: "SLACK" as const,
      frequency: "DAILY" as const,
      isActive: true,
      organizationId: org.id,
      keywords: {
        create: [
          { value: "CBDC Argentina" },
          { value: "Banco Central crypto" },
          { value: "digital peso" },
        ],
      },
    },
    {
      name: "Brazil CVM Regulations",
      channel: "EMAIL" as const,
      frequency: "WEEKLY" as const,
      isActive: true,
      organizationId: org.id,
      keywords: {
        create: [
          { value: "CVM crypto regulation" },
          { value: "Brazil digital assets law" },
        ],
      },
    },
    {
      name: "US SEC Enforcement",
      channel: "SLACK" as const,
      frequency: "DAILY" as const,
      isActive: true,
      organizationId: org.id,
      keywords: {
        create: [
          { value: "SEC crypto enforcement" },
          { value: "SEC Wells notice crypto" },
          { value: "digital asset securities" },
        ],
      },
    },
  ]

  for (const alert of alerts) {
    const created = await prisma.alert.create({ data: alert })
    console.log(`✅ Alert: ${created.name} (${created.channel}, ${created.frequency})`)
  }

  console.log(`\n🎉 Seed complete!`)
  console.log(`\nLogin: demo@meridian.app / demo1234\n`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
