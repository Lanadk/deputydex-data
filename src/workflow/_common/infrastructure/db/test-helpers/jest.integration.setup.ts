// Setup du projet Jest « integration » (jest.config.js, setupFiles) : exécuté
// avant chaque fichier de test, donc avant que testDbPool, prisma/prisma.ts ou
// le writerPool ne lisent l'environnement. Redirige DB_NAME / DB_URL vers la base
// de test (voir integrationTestEnv.ts).
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { resolveIntegrationDbEnv } from './integrationTestEnv';

const envPath = resolve(__dirname, '../../../../../..', '.env.local');
// dotenv n'écrase pas les variables déjà définies (CI, ou surcharge manuelle).
if (existsSync(envPath)) config({ path: envPath, quiet: true });

Object.assign(process.env, resolveIntegrationDbEnv(process.env));
