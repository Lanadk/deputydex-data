import * as path from 'path';
import { Pool } from 'pg';
import { runSqlFile } from '../../../_common/infrastructure/db/sqlRunner';
import { createTestPool } from '../../../_common/infrastructure/db/test-helpers/testDbPool';

const SQL = path.resolve(__dirname, '../../../../sql');
const SCHEMA = path.join(SQL, 'schema', 'acteurs.schema.sql');
const PROJECTION = path.join(SQL, 'scripts', 'acteurs', 'projections', 'project_organes.sql');
const SYNC = path.join(SQL, 'scripts', 'acteurs', 'sync', 'sync_snapshot_to_final.sql');
const DROP_SNAPSHOTS = path.join(SQL, 'scripts', 'acteurs', 'cleanup', 'drop_snapshots_tables.sql');
const DROP_RAW = path.join(SQL, 'scripts', 'acteurs', 'cleanup', 'drop_raw_tables.sql');

const UIDS = ['PO_IT_COMPER', 'PO_IT_MIN'];

/** Ligne telle qu'écrite par OrganesExtractor (le row_hash change avec le contenu). */
const organe = (uid: string, legislature_snapshot: number, overrides: Record<string, unknown> = {}) => ({
    uid,
    code_type: 'COMPER',
    libelle: 'Commission des finances',
    libelle_edition: 'de la commission des finances',
    libelle_abrege: 'Finances',
    libelle_abrev: 'CION_FIN',
    date_debut: '1958-12-09',
    date_fin: null,
    organe_parent_uid: null,
    organe_precedent_uid: null,
    preseance: null,
    legislature: null,
    legislature_snapshot,
    row_hash: `${uid}-${legislature_snapshot}-${JSON.stringify(overrides)}`,
    ...overrides,
});

describe('import des organes : raw → snapshot → organes (integration)', () => {
    let pool: Pool;

    beforeAll(() => {
        pool = createTestPool();
    });

    afterAll(async () => {
        await pool.query('DELETE FROM organes WHERE uid = ANY($1)', [UIDS]);
        await runSqlFile(pool, DROP_SNAPSHOTS);
        await runSqlFile(pool, DROP_RAW);
        await pool.end();
    });

    /** Une passe d'import : schéma, un lot brut par législature (projeté), puis synchro. */
    async function importer(lots: Array<Array<Record<string, unknown>>>) {
        await runSqlFile(pool, SCHEMA);
        for (const lot of lots) {
            for (const ligne of lot) await pool.query('INSERT INTO organes_raw (data) VALUES ($1)', [JSON.stringify(ligne)]);
            await runSqlFile(pool, PROJECTION);
            await pool.query('TRUNCATE organes_raw');
        }
        await runSqlFile(pool, SYNC);
    }

    const lire = async () => (await pool.query(
        `SELECT uid, code_type, libelle_abrege, organe_parent_uid, preseance, legislature_snapshot,
                to_char(date_debut, 'YYYY-MM-DD') AS date_debut, to_char(date_fin, 'YYYY-MM-DD') AS date_fin
         FROM organes WHERE uid = ANY($1) ORDER BY uid`, [UIDS])).rows;

    it('un organe présent dans deux législatures : la dernière importée l\'emporte', async () => {
        await importer([
            [organe('PO_IT_COMPER', 16, { libelle_abrege: 'Finances (16)' })],
            [
                organe('PO_IT_COMPER', 17),
                organe('PO_IT_MIN', 17, {
                    code_type: 'MINISTERE', libelle_abrege: 'Intérieur', date_debut: '2025-10-05', date_fin: '2025-10-10',
                    organe_parent_uid: 'PO_IT_GOUV', preseance: 5,
                }),
            ],
        ]);

        expect(await lire()).toEqual([
            {
                uid: 'PO_IT_COMPER', code_type: 'COMPER', libelle_abrege: 'Finances', organe_parent_uid: null, preseance: null,
                legislature_snapshot: 17, date_debut: '1958-12-09', date_fin: null,
            },
            {
                uid: 'PO_IT_MIN', code_type: 'MINISTERE', libelle_abrege: 'Intérieur', organe_parent_uid: 'PO_IT_GOUV', preseance: 5,
                legislature_snapshot: 17, date_debut: '2025-10-05', date_fin: '2025-10-10',
            },
        ]);
    });

    it('rejouer le même import ne crée pas de doublon ; un changement de contenu met à jour', async () => {
        await importer([[organe('PO_IT_COMPER', 17)]]);
        expect((await lire()).filter((o) => o.uid === 'PO_IT_COMPER')).toHaveLength(1);

        await importer([[organe('PO_IT_COMPER', 17, { libelle_abrege: 'Budget' })]]);
        expect((await lire()).find((o) => o.uid === 'PO_IT_COMPER')?.libelle_abrege).toBe('Budget');
    });
});
