/**
 * Generate support tokens for existing projects
 * Run with: pnpm tsx scripts/generate-support-tokens.ts
 */

import { prisma } from "../src/lib/prisma";

async function generateSupportTokens() {
  console.log("🔑 Generating support tokens for projects...\n");

  // Find all projects
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      organizationId: true,
    },
  });

  // Filter those without supportToken
  const projectsWithoutToken = projects.filter((p: any) => !p.supportToken);

  console.log(`Found ${projectsWithoutToken.length} projects without support token\n`);

  if (projectsWithoutToken.length === 0) {
    console.log("✅ All projects already have support tokens!");
    return;
  }

  // Get organization names for display
  const orgs = await prisma.organization.findMany({
    select: { id: true, name: true },
  });
  const orgMap = new Map(orgs.map(o => [o.id, o.name]));

  // Generate tokens for each project
  for (const project of projectsWithoutToken) {
    // Generate random token (24 chars)
    const supportToken = Array.from({ length: 24 }, () =>
      Math.random().toString(36)[2] || '0'
    ).join('');

    await prisma.$executeRawUnsafe(
      `UPDATE "projects" SET "supportToken" = '${supportToken}' WHERE id = '${project.id}'`
    );

    const orgName = orgMap.get(project.organizationId) || "Unknown";
    console.log(`✅ Generated token for "${project.name}" (${orgName})`);
    console.log(`   Token: ${supportToken}`);
    console.log(`   Support URL: https://crmdev.tech/support/${supportToken}\n`);
  }

  console.log(`\n✅ Generated ${projectsWithoutToken.length} support tokens!`);
}

generateSupportTokens()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
