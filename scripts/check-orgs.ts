/**
 * Script to check user organizations
 * Run with: pnpm tsx scripts/check-orgs.ts <user-email>
 */

import { prisma } from "../src/lib/prisma";

async function checkUserOrgs(userEmail: string) {
  console.log(`🔍 Checking organizations for user: ${userEmail}\n`);

  // Get user
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    console.log("❌ User not found");
    return;
  }

  console.log(`✅ User found: ${user.name} (${user.id})\n`);

  // Check memberships
  const memberships = await prisma.member.findMany({
    where: { userId: user.id },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
        },
      },
    },
  });

  console.log(`📊 Found ${memberships.length} membership(s):\n`);

  if (memberships.length === 0) {
    console.log("⚠️  User is NOT a member of any organization");
    console.log("\n💡 To create an organization, go to /select-org and create one");
  } else {
    memberships.forEach((membership, index) => {
      console.log(`${index + 1}. ${membership.organization.name}`);
      console.log(`   Slug: ${membership.organization.slug}`);
      console.log(`   Role: ${membership.role}`);
      console.log(`   Org ID: ${membership.organization.id}`);
      console.log(`   Member ID: ${membership.id}`);
      console.log("");
    });
  }

  // Check all organizations (for comparison)
  console.log("\n🏢 All organizations in database:\n");
  const allOrgs = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: { members: true },
      },
    },
  });

  if (allOrgs.length === 0) {
    console.log("⚠️  No organizations in database");
  } else {
    allOrgs.forEach((org) => {
      const isMember = memberships.some(m => m.organizationId === org.id);
      console.log(`${isMember ? "✅" : "❌"} ${org.name} (${org.slug})`);
      console.log(`   Members: ${org._count.members}`);
      console.log(`   ID: ${org.id}`);
      console.log("");
    });
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.log("Usage: pnpm tsx scripts/check-orgs.ts <user-email>");
  console.log("\nExample: pnpm tsx scripts/check-orgs.ts user@example.com");
  process.exit(1);
}

checkUserOrgs(email)
  .then(() => {
    console.log("\n✅ Check complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
