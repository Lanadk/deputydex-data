import * as path from 'path';
import { Pool } from 'pg';
import { runSqlFile } from '../../../_common/infrastructure/db/sqlRunner';
import { createTestPool } from '../../../_common/infrastructure/db/test-helpers/testDbPool';

const SQL = path.resolve(__dirname, '../../../../sql');
const SCRIPTS = path.join(SQL, 'scripts', 'reunions');
const SCHEMA = path.join(SQL, 'schema', 'reunions.schema.sql');
const SYNC = path.join(SCRIPTS, 'sync', 'sync_snapshot_to_final.sql');
const DROP_SNAPSHOTS = path.join(SCRIPTS, 'cleanup', 'drop_snapshots_tables.sql');
const DROP_RAW = path.join(SCRIPTS, 'cleanup', 'drop_raw_tables.sql');

const TABLES = [
    { raw: 'reunions_raw', projection: 'project_reunions.sql' },
    { raw: 'reunions_participants_raw', projection: 'project_reunions_participants.sql' },
    { raw: 'reunions_points_odj_raw', projection: 'project_reunions_points_odj.sql' },
    { raw: 'reunions_points_odj_dossiers_raw', projection: 'project_reunions_points_odj_dossiers.sql' },
] as const;

const UID = 'RU_IT_COMMISSION';
const POINT = 'RU_IT_COMMISSIONPT1';

/** Lignes telles qu'écrites par ReunionsExtractor (le row_hash change avec le contenu). */
const hash = (o: Record<string, unknown>) => JSON.stringify(o);

const reunion = (overrides: Record<string, unknown> = {}) => {
    const r = {
        uid: UID, type_reunion: 'commission', legislature: 17, organe_uid: 'PO59048', etat: 'Confirmé',
        date_debut: '2024-07-24T09:30:00.000+02:00', date_fin: '2024-07-24T09:40:00.000+02:00',
        session_ref: null, compte_rendu_ref: 'CRCANR5L17S2024PO59048N002', lieu_ref: 'SLANPBS6351',
        lieu_libelle: 'Salle 6351', format_reunion: 'Ordinaire', sous_type_reunion: null,
        visio_conference: false, captation_video: false, ouverture_presse: false, est_reunion_internationale: false,
        date_seance: null, id_jo: null, num_seance_jo: null, quantieme: null,
        resume_odj: 'désignation des rapporteurs', convocation_odj: null, legislature_snapshot: 17,
        ...overrides,
    };
    return { ...r, row_hash: hash(r) };
};

const participant = (acteur_uid: string, presence: string) => {
    const p = { reunion_uid: UID, acteur_uid, presence, legislature_snapshot: 17 };
    return { ...p, row_hash: hash(p) };
};

const point = () => {
    const p = {
        uid: POINT, reunion_uid: UID, ordre: 0, type_point: 'Nomination rapporteur', objet: 'Désignation',
        etat: 'Confirmé', procedure: null, nature_travaux: null, comite_secret: false, date_conf_pres: null,
        legislature_snapshot: 17,
    };
    return { ...p, row_hash: hash(p) };
};

const lienDossier = (dossier_uid: string) => {
    const d = { point_uid: POINT, reunion_uid: UID, dossier_uid, legislature_snapshot: 17 };
    return { ...d, row_hash: hash(d) };
};

describe('import des réunions : raw → snapshot → final (integration)', () => {
    let pool: Pool;

    beforeAll(() => {
        pool = createTestPool();
    });

    afterAll(async () => {
        await pool.query('DELETE FROM reunions WHERE uid = $1', [UID]);
        await runSqlFile(pool, DROP_SNAPSHOTS);
        await runSqlFile(pool, DROP_RAW);
        await pool.end();
    });

    /** Une passe d'import : schéma, un lot brut par table (projeté), puis synchro. */
    async function importer(lots: [unknown[], unknown[], unknown[], unknown[]]) {
        await runSqlFile(pool, SCHEMA);
        for (let i = 0; i < TABLES.length; i++) {
            for (const ligne of lots[i]) {
                await pool.query(`INSERT INTO ${TABLES[i].raw} (data) VALUES ($1)`, [JSON.stringify(ligne)]);
            }
            await runSqlFile(pool, path.join(SCRIPTS, 'projections', TABLES[i].projection));
        }
        await runSqlFile(pool, SYNC);
    }

    const lireReunion = async () => (await pool.query(
        `SELECT type_reunion, organe_uid, etat, date_debut, ouverture_presse, resume_odj
         FROM reunions WHERE uid = $1`, [UID])).rows;
    const lireParticipants = async () => (await pool.query(
        'SELECT acteur_uid, presence FROM reunions_participants WHERE reunion_uid = $1 ORDER BY acteur_uid', [UID])).rows;
    const lireDossiers = async () => (await pool.query(
        `SELECT d.dossier_uid, p.type_point
         FROM reunions_points_odj_dossiers d JOIN reunions_points_odj p ON p.uid = d.point_uid
         WHERE d.reunion_uid = $1 ORDER BY d.dossier_uid`, [UID])).rows;

    it('importe la réunion, sa liste de présence, ses points et leurs dossiers', async () => {
        await importer([
            [reunion()],
            [participant('PA1', 'présent'), participant('PA2', 'absent'), participant('PA3', 'excusé')],
            [point()],
            [lienDossier('DLR5L17N50198'), lienDossier('DLR5L17N50588')],
        ]);

        expect(await lireReunion()).toEqual([{
            type_reunion: 'commission', organe_uid: 'PO59048', etat: 'Confirmé',
            date_debut: new Date('2024-07-24T07:30:00.000Z'), ouverture_presse: false,
            resume_odj: 'désignation des rapporteurs',
        }]);
        expect(await lireParticipants()).toEqual([
            { acteur_uid: 'PA1', presence: 'présent' },
            { acteur_uid: 'PA2', presence: 'absent' },
            { acteur_uid: 'PA3', presence: 'excusé' },
        ]);
        expect(await lireDossiers()).toEqual([
            { dossier_uid: 'DLR5L17N50198', type_point: 'Nomination rapporteur' },
            { dossier_uid: 'DLR5L17N50588', type_point: 'Nomination rapporteur' },
        ]);
    });

    it('rejouer le même import ne crée pas de doublon ; un changement de présence ou d\'état met à jour', async () => {
        await importer([[reunion()], [participant('PA1', 'présent')], [point()], []]);
        expect(await lireReunion()).toHaveLength(1);

        await importer([
            [reunion({ etat: 'Annulé' })],
            [participant('PA1', 'excusé')],
            [point()],
            [],
        ]);
        expect((await lireReunion())[0].etat).toBe('Annulé');
        expect((await lireParticipants()).find((p) => p.acteur_uid === 'PA1')?.presence).toBe('excusé');
    });

    it('supprimer une réunion supprime ses participants, points et dossiers (cascade)', async () => {
        await pool.query('DELETE FROM reunions WHERE uid = $1', [UID]);

        expect(await lireParticipants()).toEqual([]);
        expect(await lireDossiers()).toEqual([]);
        expect((await pool.query('SELECT 1 FROM reunions_points_odj WHERE uid = $1', [POINT])).rows).toEqual([]);
    });
});
