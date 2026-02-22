import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EMAIL_TO_KEEP = "josemas68@gmail.com";

async function cleanupUsers() {
  console.log("🧹 Starting user cleanup...");
  console.log(`📧 Keeping user: ${EMAIL_TO_KEEP}`);

  try {
    // Get all users except the one we want to keep
    const usersToDelete = await prisma.user.findMany({
      where: {
        email: {
          not: EMAIL_TO_KEEP,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log(`👥 Found ${usersToDelete.length} users to delete`);

    if (usersToDelete.length === 0) {
      console.log("✅ No users to delete");
      return;
    }

    // Display users that will be deleted
    console.log("\n📋 Users to be deleted:");
    usersToDelete.forEach((user) => {
      console.log(`  - ${user.email} (${user.name || "No name"})`);
    });

    // Delete users (cascade will handle related data)
    for (const user of usersToDelete) {
      await prisma.user.delete({
        where: { id: user.id },
      });
      console.log(`✅ Deleted: ${user.email}`);
    }

    console.log("\n✨ Cleanup completed successfully");
    console.log(`👤 Kept user: ${EMAIL_TO_KEEP}`);
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupUsers()
  .then(() => {
    console.log("✅ Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
