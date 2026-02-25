#!/usr/bin/env node

/**
 * Script para generar un token de Telegram de prueba
 * Uso: node scripts/test-telegram-link.js
 */

const { PrismaClient } = require('@prisma/client');
const randomBytes = require('crypto').randomBytes;

const prisma = new PrismaClient();

async function main() {
  // Obtener la primera organización
  const org = await prisma.organization.findFirst();

  if (!org) {
    console.error('❌ No hay organizaciones en la base de datos');
    process.exit(1);
  }

  // Generar token
  const tokenBytes = randomBytes(4).toString('hex').toUpperCase();
  const token = `TG-${tokenBytes}`;

  // Crear token en BD
  const linkToken = await prisma.telegramLinkToken.create({
    data: {
      token,
      organizationId: org.id,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
    },
  });

  console.log('✅ Token generado correctamente:');
  console.log('');
  console.log(`   Token: ${linkToken.token}`);
  console.log(`   Organización: ${org.name}`);
  console.log(`   Expira: ${linkToken.expiresAt}`);
  console.log('');
  console.log('Para probar la vinculación:');
  console.log('');
  console.log(`curl -X POST https://crmdev.tech/api/telegram/link \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{`);
  console.log(`    "token": "${linkToken.token}",`);
  console.log(`    "telegramUserId": "311763397",`);
  console.log(`    "telegramUsername": "Josemas81"`);
  console.log(`  }'`);
  console.log('');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
