import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Buscar usuarios con cuentas de GitHub
  const accounts = await prisma.account.findMany({
    where: {
      providerId: "github",
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          githubUsername: true,
        },
      },
    },
  });

  console.log("\n=== Cuentas de GitHub conectadas ===\n");

  if (accounts.length === 0) {
    console.log("No hay cuentas de GitHub conectadas.");
    console.log("\nPara conectar tu cuenta de GitHub:");
    console.log("1. Ve a /integraciones en la app");
    console.log("2. Haz clic en 'Conectar con GitHub'");
    console.log("3. Autoriza la aplicación");
    return;
  }

  for (const account of accounts) {
    console.log(`Usuario: ${account.user.email}`);
    console.log(`  GitHub Username: ${account.user.githubUsername || "No sincronizado"}`);
    console.log(`  Account ID: ${account.accountId}`);
    console.log(`  Access Token: ${account.accessToken ? "✅ Guardado" : "❌ No guardado"}`);
    console.log(`  Token Expires At: ${account.accessTokenExpiresAt || "No establecido"}`);
    console.log(`  Scope: ${account.scope || "No establecido"}`);
    console.log("");
  }

  console.log("\nSi el access token no está guardado, reconecta tu cuenta de GitHub.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
