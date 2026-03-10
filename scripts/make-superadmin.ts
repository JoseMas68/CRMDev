import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Lista todos los usuarios
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      isSuperAdmin: true,
    },
  });

  console.log("📋 Usuarios actuales:");
  console.table(users);

  if (users.length === 0) {
    console.log("\n❌ No hay usuarios en la base de datos");
    process.exit(1);
  }

  console.log("\n📧 Ingresa el EMAIL del usuario que quieres hacer superadmin:");
  console.log("(o presiona Enter para usar el primer usuario)");

  // El primer parámetro es el email, segundo es default al primer usuario
  const email = process.argv[2] || users[0].email;

  // Actualizar usuario
  const updatedUser = await prisma.user.update({
    where: { email },
    data: { isSuperAdmin: true },
  });

  console.log(`\n✅ Usuario "${updatedUser.name}" (${updatedUser.email}) ahora es SUPERADMIN`);
  console.log(`\n🔗 Accede al panel de admin: http://localhost:3000/admin`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
