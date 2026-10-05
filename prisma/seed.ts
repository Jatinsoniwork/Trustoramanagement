import { PrismaClient, AdminRole, ClientStatus, BusinessStatus, GoogleAccountStatus, ReviewRequestStatus, ActivityAction } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding development demo data...");

  // 1. Admin Operator
  const admin = await prisma.adminUser.upsert({
    where: { email: "operator@reviewflow.local" },
    update: {},
    create: {
      name: "Primary Operator",
      email: "operator@reviewflow.local",
      role: AdminRole.ADMIN,
    },
  });

  // 2. Demo Clients (Cleanly marked development data)
  const clientAlpha = await prisma.client.create({
    data: {
      name: "Demo Apex Hospitality Group",
      contactName: "Marcus Vance",
      email: "marcus.vance@demo-apex.example.com",
      phone: "+1 (555) 019-2834",
      notes: "Development test client operating boutique dining establishments.",
      status: ClientStatus.ACTIVE,
    },
  });

  const clientBeta = await prisma.client.create({
    data: {
      name: "Sample Summit Wellness",
      contactName: "Elena Rostova",
      email: "elena@sample-summit.example.com",
      phone: "+1 (555) 014-8891",
      notes: "Development test client offering physical therapy and sports recovery.",
      status: ClientStatus.ACTIVE,
    },
  });

  // 3. Demo Businesses
  const businessCafe = await prisma.business.create({
    data: {
      clientId: clientAlpha.id,
      name: "Demo Artisan Cafe & Roastery",
      googleMapsUrl: "https://maps.google.com/?cid=1000000000000000001",
      placeIdentifier: "ChIJ_DEMO_CAFE_01",
      category: "Coffee Shop & Bakery",
      location: "Downtown Plaza, Suite 104, Austin, TX",
      notes: "Specializes in single-origin pour-overs and fresh sourdough pastries.",
      status: BusinessStatus.ACTIVE,
    },
  });

  const businessBistro = await prisma.business.create({
    data: {
      clientId: clientAlpha.id,
      name: "Demo Hearthstone Bistro",
      googleMapsUrl: "https://maps.google.com/?cid=1000000000000000002",
      placeIdentifier: "ChIJ_DEMO_BISTRO_02",
      category: "Fine Dining Restaurant",
      location: "420 Riverfront Ave, Austin, TX",
      notes: "Farm-to-table seasonal dining.",
      status: BusinessStatus.ACTIVE,
    },
  });

  await prisma.business.create({
    data: {
      clientId: clientBeta.id,
      name: "Sample Summit Physical Therapy",
      googleMapsUrl: "https://maps.google.com/?cid=1000000000000000003",
      placeIdentifier: "ChIJ_DEMO_CLINIC_03",
      category: "Physical Therapy Clinic",
      location: "880 Medical Way, Denver, CO",
      notes: "Comprehensive sports rehabilitation and post-op recovery.",
      status: BusinessStatus.ACTIVE,
    },
  });

  // 4. Future Google Account Placeholder (Clean dev placeholder, zero tokens)
  const googleAccount = await prisma.googleAccount.create({
    data: {
      displayName: "Authorized Review Operator (Demo)",
      email: "operator.managed@example-partner.com",
      googleUserId: "demo_google_uid_987654",
      status: GoogleAccountStatus.DISCONNECTED,
    },
  });

  // 5. Review Requests (Clean genuine customer experiences entered by operator)
  const req1 = await prisma.reviewRequest.create({
    data: {
      businessId: businessCafe.id,
      googleAccountId: googleAccount.id,
      experience: "Visited on Saturday morning. The barista explained the Ethiopian light roast notes patiently. The cardamom bun was freshly baked and still warm.",
      rating: 5,
      language: "en",
      tone: "authentic",
      keywords: "Ethiopian roast, cardamom bun, patient barista",
      requestedLength: "standard",
      status: ReviewRequestStatus.DRAFT,
    },
  });

  await prisma.reviewRequest.create({
    data: {
      businessId: businessBistro.id,
      experience: "Celebrated our anniversary dinner. The wild mushroom risotto and wood-fired trout were cooked to perfection. Attentive host and relaxed ambiance.",
      rating: 5,
      language: "en",
      tone: "warm",
      keywords: "anniversary dinner, mushroom risotto, wood-fired trout",
      requestedLength: "detailed",
      status: ReviewRequestStatus.DRAFT,
    },
  });

  // 6. Audit Trail
  await prisma.activityLog.createMany({
    data: [
      {
        actorId: admin.id,
        action: ActivityAction.CLIENT_CREATED,
        entityType: "Client",
        entityId: clientAlpha.id,
        metadata: { name: clientAlpha.name },
      },
      {
        actorId: admin.id,
        action: ActivityAction.BUSINESS_CREATED,
        entityType: "Business",
        entityId: businessCafe.id,
        metadata: { name: businessCafe.name },
      },
      {
        actorId: admin.id,
        action: ActivityAction.REVIEW_REQUEST_CREATED,
        entityType: "ReviewRequest",
        entityId: req1.id,
        metadata: { business: businessCafe.name, rating: 5 },
      },
    ],
  });

  console.log("✅ Seed completed successfully with clean development test data.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
