/**
 * Migration script: Encrypt existing OpenAI API keys
 *
 * Usage:
 *   pnpm tsx prisma/migrate-openai-keys.ts
 *
 * Prerequisites:
 *   - Set ENCRYPTION_SECRET in .env (min 32 chars)
 *   - Run prisma db:push first to add new columns
 */

import { PrismaClient } from '@prisma/client';
import { encrypt } from '../src/lib/encryption';

const prisma = new PrismaClient();

async function migrateOpenAIKeys() {
  console.log('🔐 Starting OpenAI API key encryption migration...\n');

  // Check for encryption secret
  if (!process.env.ENCRYPTION_SECRET) {
    console.error('❌ ENCRYPTION_SECRET environment variable not set');
    console.error('Please add it to your .env file (min 32 characters)');
    process.exit(1);
  }

  if (process.env.ENCRYPTION_SECRET.length < 32) {
    console.error('❌ ENCRYPTION_SECRET must be at least 32 characters');
    process.exit(1);
  }

  // Find organizations with plaintext keys that haven't been migrated
  const organizations = await prisma.organization.findMany({
    where: {
      openaiApiKey: { not: null },
      openaiApiKeyEncrypted: null,
    },
    select: {
      id: true,
      name: true,
      openaiApiKey: true,
    },
  });

  if (organizations.length === 0) {
    console.log('✅ No plaintext keys found. Migration complete!\n');
    return;
  }

  console.log(`📋 Found ${organizations.length} organizations with plaintext keys\n`);

  let successCount = 0;
  let failureCount = 0;

  for (const org of organizations) {
    try {
      console.log(`🔒 Encrypting key for: ${org.name} (${org.id})`);

      // Encrypt the key
      const { encrypted, nonce } = encrypt(org.openaiApiKey!);

      // Update organization with encrypted version
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          openaiApiKeyEncrypted: encrypted,
          openaiApiKeyNonce: nonce,
        },
      });

      console.log(`   ✅ Encrypted successfully\n`);
      successCount++;
    } catch (error) {
      console.error(`   ❌ Failed to migrate key for: ${org.name}`);
      console.error(`   Error: ${error}\n`);
      failureCount++;
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Successfully migrated: ${successCount}`);
  if (failureCount > 0) {
    console.log(`❌ Failed: ${failureCount}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n⚠️  IMPORTANT: After verifying encrypted keys work:');
  console.log('   1. Update application code to use encrypted fields');
  console.log('   2. Remove openaiApiKey column from schema');
  console.log('   3. Run migration to drop the plaintext column\n');
}

migrateOpenAIKeys()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    prisma.$disconnect();
    process.exit(1);
  });
