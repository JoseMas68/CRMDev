/**
 * List all projects with their support tokens and URLs
 * Run with: pnpm tsx scripts/list-support-tokens.ts
 */

import { prisma } from "../src/lib/prisma";

async function listSupportTokens() {
  console.log("📋 Support Tokens for all projects\n");

  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      supportToken: true,
      organization: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      organization: {
        name: "asc",
      },
    },
  });

  let currentOrg = "";

  for (const project of projects) {
    if (project.organization.name !== currentOrg) {
      currentOrg = project.organization.name;
      console.log(`\n🏢 ${currentOrg}`);
      console.log("=".repeat(60));
    }

    if (project.supportToken) {
      console.log(`\n  ${project.name}`);
      console.log(`  Token: ${project.supportToken}`);
      console.log(`  URL: https://crmdev.tech/support/${project.supportToken}`);
    } else {
      console.log(`\n  ${project.name}`);
      console.log(`  ⚠️  No token generated`);
    }
  }

  console.log(`\n\nTotal: ${projects.length} projects`);
}

listSupportTokens()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
