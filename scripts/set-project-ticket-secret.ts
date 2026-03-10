import { PrismaClient } from "@prisma/client";

const PROJECT_ID = process.env.PROJECT_ID;
const NEW_SECRET = process.env.NEW_SECRET;

async function main() {
  if (!PROJECT_ID || !NEW_SECRET) {
    console.error("PROJECT_ID y NEW_SECRET son requeridos.");
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const project = await prisma.project.findUnique({
      where: { id: PROJECT_ID },
      select: { id: true, name: true, customData: true },
    });

    if (!project) {
      console.error("Proyecto no encontrado");
      process.exit(1);
    }

    const customData = (project.customData as Record<string, unknown> | null) ?? {};
    customData.ticketWebhookSecret = NEW_SECRET;

    await prisma.project.update({
      where: { id: PROJECT_ID },
      data: {
        customData: customData as unknown, // Cast to JsonValue
      },
    });

    console.log(`Secret actualizado para ${project.name} (${project.id})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
