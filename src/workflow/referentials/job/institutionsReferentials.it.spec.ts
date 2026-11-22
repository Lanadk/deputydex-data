import * as path from 'path';
import { Pool } from 'pg';
import { runSqlFile } from '../../_common/infrastructure/db/sqlRunner';
import { createTestPool } from '../../_common/infrastructure/db/test-helpers/testDbPool';

const scriptsDir = path.resolve(__dirname, '../../../sql/scripts/institutions/referentials');
const FICHIERS = ['ref_portraits.sql', 'ref_mandats_presidentiels.sql', 'ref_evenements_institutionnels.sql', 'ref_fonctions_definitions.sql'];
const TABLES = ['ref_portraits', 'ref_mandats_presidentiels', 'ref_evenements_institutionnels', 'ref_fonctions_definitions'];

describe('référentiels institutions (integration)', () => {
    let pool: Pool;

    beforeAll(() => {
        pool = createTestPool();
    });

    afterAll(async () => {
        await pool.end();
    });

    const compter = async (table: string) => (await pool.query(`SELECT count(*)::int AS n FROM ${table};`)).rows[0].n as number;

    it('s\'appliquent et se rejouent sans doublon (upsert idempotent)', async () => {
        for (const f of FICHIERS) await runSqlFile(pool, path.join(scriptsDir, f));
        const avant = await Promise.all(TABLES.map(compter));

        for (const f of FICHIERS) await runSqlFile(pool, path.join(scriptsDir, f));
        const apres = await Promise.all(TABLES.map(compter));

        expect(apres).toEqual(avant);
        expect(avant.every((n) => n > 0)).toBe(true);
    });

    it('un seul mandat présidentiel en cours', async () => {
        expect((await pool.query('SELECT count(*)::int AS n FROM ref_mandats_presidentiels WHERE fin IS NULL;')).rows[0].n).toBe(1);
    });

    it('chaque portrait_slug référencé existe dans ref_portraits, avec auteur et licence', async () => {
        const orphelins = await pool.query(`
            SELECT m.portrait_slug FROM ref_mandats_presidentiels m
            LEFT JOIN ref_portraits p ON p.slug = m.portrait_slug
            WHERE m.portrait_slug IS NOT NULL AND p.slug IS NULL;
        `);
        expect(orphelins.rows).toEqual([]);

        const sansCredit = await pool.query("SELECT slug FROM ref_portraits WHERE auteur = '' OR licence = '';");
        expect(sansCredit.rows).toEqual([]);
    });

    it('définit chaque fonction des organigrammes, avec un texte non vide', async () => {
        const { rows } = await pool.query("SELECT slug FROM ref_fonctions_definitions WHERE trim(definition) <> '' ORDER BY slug;");
        expect(rows.map((r) => r.slug)).toEqual(expect.arrayContaining([
            'assemblee-president', 'assemblee-vice-president', 'assemblee-questeur', 'assemblee-secretaire',
            'assemblee-president-groupe', 'assemblee-president-commission',
            'president-republique', 'premier-ministre',
            'ministre-etat', 'ministre', 'ministre-delegue', 'secretaire-etat',
        ]));
    });
});
