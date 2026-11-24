import * as path from 'path';
import { Pool } from 'pg';
import { runSqlFile } from '../../../_common/infrastructure/db/sqlRunner';
import { createTestPool } from '../../../_common/infrastructure/db/test-helpers/testDbPool';

const SQL = path.resolve(__dirname, '../../../../sql');
const SCRIPTS = path.join(SQL, 'scripts', 'debats');
const SCHEMA = path.join(SQL, 'schema', 'debats.schema.sql');
const SYNC = path.join(SCRIPTS, 'sync', 'sync_snapshot_to_final.sql');
const DROP_SNAPSHOTS = path.join(SCRIPTS, 'cleanup', 'drop_snapshots_tables.sql');
const DROP_RAW = path.join(SCRIPTS, 'cleanup', 'drop_raw_tables.sql');

const TABLES = [
    { raw: 'debats_comptes_rendus_raw', projection: 'project_debats_comptes_rendus.sql' },
    { raw: 'debats_points_raw', projection: 'project_debats_points.sql' },
    { raw: 'debats_interventions_raw', projection: 'project_debats_interventions.sql' },
    { raw: 'debats_interventions_orateurs_raw', projection: 'project_debats_interventions_orateurs.sql' },
] as const;

const CR = 'CR_IT_DEBATS';

/** Lignes telles qu'écrites par DebatsExtractor (le row_hash change avec le contenu). */
const ligne = (o: Record<string, unknown>) => ({ ...o, legislature_snapshot: 17, row_hash: JSON.stringify(o) });

const compteRendu = (overrides: Record<string, unknown> = {}) => ligne({
    uid: CR, seance_uid: 'RU_IT_SEANCE', session_ref: 'SCR5A2024D1', date_seance: '2024-07-18T15:00:00',
    date_seance_libelle: 'jeudi 18 juillet 2024', num_seance: 1, quantieme: 'Unique', legislature: 17,
    session_libelle: 'Session de droit juillet 2024', num_jo: '20245001', etat: 'complet', validite: 'valide',
    version: 'avant_JO', ...overrides,
});
const point = ligne({
    id: 'IT_PT1', compte_rendu_uid: CR, parent_id: null, profondeur: 1, ordre: 11, valeur_pts_odj: '3',
    code_grammaire: 'TITRE_TEXTE_DISCUSSION', titre: 'Ouverture de la XVIIe législature',
});
const intervention = (id: string, overrides: Record<string, unknown> = {}) => ligne({
    id, compte_rendu_uid: CR, point_id: 'IT_PT1', ordre: 12, acteur_uid: 'PA793362', mandat_uid: 'PM842465',
    role_debat: 'president', code_grammaire: 'PAROLE_GENERIQUE', code_style: 'NORMAL', type_debat: null,
    orateurs_libelle: 'M. le président', texte: 'La séance est ouverte.', stime: 1099.79, bibard: null,
    article: null, amendement: null, sous_amendement: null, amendement_uid: null, decision: null, ...overrides,
});
const orateur = (intervention_id: string, ordre: number, acteur_uid: string | null, nom: string) =>
    ligne({ intervention_id, ordre, acteur_uid, nom, qualite: null });

describe('import des débats : raw → snapshot → final (integration)', () => {
    let pool: Pool;

    beforeAll(() => {
        pool = createTestPool();
    });

    afterAll(async () => {
        await pool.query('DELETE FROM debats_comptes_rendus WHERE uid = $1', [CR]);
        await runSqlFile(pool, DROP_SNAPSHOTS);
        await runSqlFile(pool, DROP_RAW);
        await pool.end();
    });

    async function importer(lots: [unknown[], unknown[], unknown[], unknown[]]) {
        await runSqlFile(pool, SCHEMA);
        for (let i = 0; i < TABLES.length; i++) {
            for (const l of lots[i]) await pool.query(`INSERT INTO ${TABLES[i].raw} (data) VALUES ($1)`, [JSON.stringify(l)]);
            await runSqlFile(pool, path.join(SCRIPTS, 'projections', TABLES[i].projection));
        }
        await runSqlFile(pool, SYNC);
    }

    const lireOrateurs = async () => (await pool.query(
        `SELECT o.intervention_id, o.ordre, o.acteur_uid FROM debats_interventions_orateurs o
         JOIN debats_interventions i ON i.id = o.intervention_id WHERE i.compte_rendu_uid = $1
         ORDER BY o.intervention_id, o.ordre`, [CR])).rows;

    it('importe le compte rendu (heure de Paris → instant UTC), ses points, interventions et orateurs', async () => {
        await importer([
            [compteRendu()],
            [point],
            [intervention('IT_P1'), intervention('IT_P2', { ordre: 13, acteur_uid: null, code_grammaire: 'INTERRUPTION_1_10', stime: null })],
            [orateur('IT_P1', 0, 'PA793362', 'M. le président'), orateur('IT_P2', 0, 'PA719558', 'M. Erwan Balanant'), orateur('IT_P2', 1, null, 'M. François Bayrou')],
        ]);

        const cr = (await pool.query('SELECT seance_uid, date_seance FROM debats_comptes_rendus WHERE uid = $1', [CR])).rows;
        // 15 h à Paris en juillet (UTC+2) = 13 h UTC.
        expect(cr).toEqual([{ seance_uid: 'RU_IT_SEANCE', date_seance: new Date('2024-07-18T13:00:00.000Z') }]);

        const interventions = (await pool.query(
            `SELECT id, point_id, acteur_uid, code_grammaire, stime::text AS stime FROM debats_interventions
             WHERE compte_rendu_uid = $1 ORDER BY ordre`, [CR])).rows;
        expect(interventions).toEqual([
            { id: 'IT_P1', point_id: 'IT_PT1', acteur_uid: 'PA793362', code_grammaire: 'PAROLE_GENERIQUE', stime: '1099.79' },
            { id: 'IT_P2', point_id: 'IT_PT1', acteur_uid: null, code_grammaire: 'INTERRUPTION_1_10', stime: null },
        ]);
        expect(await lireOrateurs()).toEqual([
            { intervention_id: 'IT_P1', ordre: 0, acteur_uid: 'PA793362' },
            { intervention_id: 'IT_P2', ordre: 0, acteur_uid: 'PA719558' },
            { intervention_id: 'IT_P2', ordre: 1, acteur_uid: null },
        ]);
    });

    it('rejouer le même import ne crée pas de doublon ; un texte corrigé met à jour', async () => {
        const lots: [unknown[], unknown[], unknown[], unknown[]] = [[compteRendu()], [point], [intervention('IT_P1')], [orateur('IT_P1', 0, 'PA793362', 'M. le président')]];
        await importer(lots);
        await importer([lots[0], lots[1], [intervention('IT_P1', { texte: 'La séance est ouverte (corrigé).' })], lots[3]]);

        const textes = (await pool.query('SELECT id, texte FROM debats_interventions WHERE compte_rendu_uid = $1 ORDER BY id', [CR])).rows;
        expect(textes.find((t) => t.id === 'IT_P1')?.texte).toBe('La séance est ouverte (corrigé).');
        expect(textes.filter((t) => t.id === 'IT_P1')).toHaveLength(1);
    });

    it('supprimer un compte rendu supprime points, interventions et orateurs (cascade)', async () => {
        await pool.query('DELETE FROM debats_comptes_rendus WHERE uid = $1', [CR]);

        expect((await pool.query('SELECT 1 FROM debats_points WHERE compte_rendu_uid = $1', [CR])).rows).toEqual([]);
        expect((await pool.query('SELECT 1 FROM debats_interventions WHERE compte_rendu_uid = $1', [CR])).rows).toEqual([]);
        expect((await pool.query("SELECT 1 FROM debats_interventions_orateurs WHERE intervention_id LIKE 'IT_P%'")).rows).toEqual([]);
    });
});
