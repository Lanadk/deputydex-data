import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from '../generated/prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const rootDir = resolve(__dirname, '..');
const envPath = resolve(rootDir, '.env.local');

console.log('🔍 [Prisma] Root dir:', rootDir);
console.log('🔍 [Prisma] Env path:', envPath);
console.log('🔍 [Prisma] Env exists?', existsSync(envPath) ? '✅ Oui' : '❌ Non');

if (existsSync(envPath)) {
    config({ path: envPath });
} else {
    // Fallback to .env
    const fallbackEnvPath = resolve(rootDir, '.env');
    if (existsSync(fallbackEnvPath)) {
        config({ path: fallbackEnvPath });
    }
}

console.log('🔍 [Prisma] DB_URL:', process.env.DB_URL ? '✅ Définie' : '❌ Non définie');

if (!process.env.DB_URL) {
    throw new Error('❌ DB_URL is not defined. Please check your .env.local file');
}

const pool = new Pool({
    connectionString: process.env.DB_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
    adapter,
});

export { prisma };