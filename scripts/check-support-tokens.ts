import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      supportToken: true,
    },
    take: 10,
  });

  console.log("\n=== Proyectos y sus tokens de soporte ===\n");
  projects.forEach((project) => {
    console.log(`${project.name}:`);
    console.log(`  ID: ${project.id}`);
    console.log(`  Token: ${project.supportToken || "NO GENERADO"}`);
    console.log(`  URL: /support/${project.supportToken || "SIN TOKEN"}`);
    console.log("");
  });

  const withoutToken = projects.filter((p) => !p.supportToken).length;
  console.log(`\nResumen: ${projects.length - withoutToken}/${projects.length} proyectos con token`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
