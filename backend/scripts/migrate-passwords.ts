/**
 * Password Migration Script
 * 
 * One-time script to hash all existing plaintext passwords in the database.
 * Safe to run multiple times — already-hashed passwords are skipped.
 * 
 * Usage:
 *   cd backend
 *   npx ts-node scripts/migrate-passwords.ts
 * 
 * Or with env file:
 *   node --env-file=.env -e "require('ts-node').register(); require('./scripts/migrate-passwords.ts')"
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

function isHashed(password: string): boolean {
  return /^\$2[aby]?\$\d{1,2}\$/.test(password);
}

async function migratePasswords() {
  const prisma = new PrismaClient();

  try {
    console.log('🔒 Starting password migration...\n');

    const users = await prisma.user.findMany({
      select: { id: true, email: true, password: true },
    });

    console.log(`Found ${users.length} users total.\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
      if (isHashed(user.password)) {
        skipped++;
        console.log(`  ⏭️  SKIP  ${user.email} — already hashed`);
        continue;
      }

      try {
        const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });
        migrated++;
        console.log(`  ✅ HASH  ${user.email} — password hashed successfully`);
      } catch (err) {
        errors++;
        console.error(`  ❌ ERROR ${user.email} — ${(err as Error).message}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`   Total users:   ${users.length}`);
    console.log(`   Migrated:      ${migrated}`);
    console.log(`   Skipped:       ${skipped} (already hashed)`);
    console.log(`   Errors:        ${errors}`);
    console.log('='.repeat(50));

    if (errors > 0) {
      console.log('\n⚠️  Some passwords failed to migrate. Please investigate and retry.');
      process.exit(1);
    } else {
      console.log('\n🎉 All passwords migrated successfully!');
    }
  } catch (err) {
    console.error('Fatal error during migration:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migratePasswords();
