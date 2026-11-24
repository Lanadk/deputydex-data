#!/usr/bin/env node
// Applique les migrations Prisma sur la base des tests d'intégration
// (DB_NAME_TEST), sans toucher à la base de développement.
import { execSync } from 'child_process';
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolveIntegrationDbEnv } from '../src/workflow/_common/infrastructure/db/test-helpers/integrationTestEnv';

if (existsSync('.env.local')) config({ path: '.env.local', quiet: true });

try {
    const testEnv = resolveIntegrationDbEnv(process.env);
    if (!testEnv.DB_URL) throw new Error('DB_URL et DB_NAME_TEST sont requis pour migrer la base de test.');
    console.log(`🧪 Migrations sur la base de test ${testEnv.DB_NAME}`);
    execSync('npx prisma migrate deploy', { stdio: 'inherit', env: { ...process.env, ...testEnv } });
} catch (error) {
    console.error('[ERROR  ❌ ]:', (error as Error).message);
    process.exit(1);
}
