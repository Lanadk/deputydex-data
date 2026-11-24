import * as path from 'path';
import { Pool } from 'pg';
import { runSqlFile } from '../../../_common/infrastructure/db/sqlRunner';
import { createTestPool } from '../../../_common/infrastructure/db/test-helpers/testDbPool';

const SQL = path.resolve(__dirname, '../../../../sql');
const SCRIPTS = path.join(SQL, 'scripts', 'questions');
const SCHEMA = path.join(SQL, 'schema', 'questions.schema.sql');
const SYNC = path.join(SCRIPTS, 'sync', 'sync_snapshot_to_final.sql');
const DROP_SNAPSHOTS = path.join(SCRIPTS, 'cleanup', 'drop_snapshots_tables.sql');
const DROP_RAW = path.join(SCRIPTS, 'cleanup', 'drop_raw_tables.sql');

const UIDS = ['QA_IT_QE1', 'QA_IT_QG1'];

/** Lignes telles qu'écrites par QuestionsExtractor (le row_hash change avec le contenu). */
const hash = (o: Record<string, unknown>) => JSON.stringify(o);

const question = (uid: string, overrides: Record<string, unknown> = {}) => {
    const q = {
        uid, type_question: 'QE', legislature: 17, numero: 1, acteur_uid: 'PA721486', mandat_uid: 'PM843614',
        groupe_uid: 'PO845485', groupe_abrege: 'LIOT', rubrique: 'enfants', tete_analyse: null,
        libelle_analyse: 'Réforme du CMG', ministere_uid: 'PO855081', ministere_abrege: 'Travail',
        date_question: '2025-10-07', texte_question: 'M. X attire l’attention…', date_reponse: null,
        type_jo_reponse: null, page_jo_reponse: null, texte_reponse: null, code_cloture: null,
        libelle_cloture: null, date_cloture: null, nb_renouvellements: 0, date_dernier_renouvellement: null,
        date_signalement: null, legislature_snapshot: 17,
        ...overrides,
    };
    return { ...q, row_hash: hash(q) };
};

const attribution = (question_uid: string, ordre: number, ministere_uid: string) => {
    const m = { question_uid, ordre, ministere_uid, ministere_abrege: ministere_uid, date_jo: '2025-10-07', legislature_snapshot: 17 };
    return { ...m, row_hash: hash(m) };
};

describe('import des questions : raw → snapshot → final (integration)', () => {
    let pool: Pool;

    beforeAll(() => {
        pool = createTestPool();
    });

    afterAll(async () => {
        await pool.query('DELETE FROM questions WHERE uid = ANY($1)', [UIDS]);
        await runSqlFile(pool, DROP_SNAPSHOTS);
        await runSqlFile(pool, DROP_RAW);
        await pool.end();
    });

    /** Une passe d'import : schéma, lots bruts (projetés), puis synchro. */
    async function importer(questions: unknown[], attributions: unknown[]) {
        await runSqlFile(pool, SCHEMA);
        for (const q of questions) await pool.query('INSERT INTO questions_raw (data) VALUES ($1)', [JSON.stringify(q)]);
        await runSqlFile(pool, path.join(SCRIPTS, 'projections', 'project_questions.sql'));
        for (const a of attributions) await pool.query('INSERT INTO questions_ministeres_attributaires_raw (data) VALUES ($1)', [JSON.stringify(a)]);
        await runSqlFile(pool, path.join(SCRIPTS, 'projections', 'project_questions_ministeres_attributaires.sql'));
        await runSqlFile(pool, SYNC);
    }

    const lire = async () => (await pool.query(
        `SELECT uid, type_question, code_cloture, to_char(date_reponse, 'YYYY-MM-DD') AS date_reponse, nb_renouvellements
         FROM questions WHERE uid = ANY($1) ORDER BY uid`, [UIDS])).rows;
    const lireAttributions = async () => (await pool.query(
        `SELECT question_uid, ordre, ministere_uid FROM questions_ministeres_attributaires
         WHERE question_uid = ANY($1) ORDER BY question_uid, ordre`, [UIDS])).rows;

    it('importe les questions et leurs ministères attributaires', async () => {
        await importer(
            [
                question('QA_IT_QE1'),
                question('QA_IT_QG1', {
                    type_question: 'QG', date_question: null, texte_question: null, date_reponse: '2024-10-03',
                    type_jo_reponse: 'JO_DEBAT', code_cloture: 'REP_PUB',
                }),
            ],
            [attribution('QA_IT_QE1', 0, 'PO855081'), attribution('QA_IT_QE1', 1, 'PO873673'), attribution('QA_IT_QG1', 0, 'PO847643')],
        );

        expect(await lire()).toEqual([
            { uid: 'QA_IT_QE1', type_question: 'QE', code_cloture: null, date_reponse: null, nb_renouvellements: 0 },
            { uid: 'QA_IT_QG1', type_question: 'QG', code_cloture: 'REP_PUB', date_reponse: '2024-10-03', nb_renouvellements: 0 },
        ]);
        expect(await lireAttributions()).toEqual([
            { question_uid: 'QA_IT_QE1', ordre: 0, ministere_uid: 'PO855081' },
            { question_uid: 'QA_IT_QE1', ordre: 1, ministere_uid: 'PO873673' },
            { question_uid: 'QA_IT_QG1', ordre: 0, ministere_uid: 'PO847643' },
        ]);
    });

    it('rejouer le même import ne crée pas de doublon ; une réponse publiée met la question à jour', async () => {
        await importer([question('QA_IT_QE1')], [attribution('QA_IT_QE1', 0, 'PO855081')]);
        expect((await lire()).filter((q) => q.uid === 'QA_IT_QE1')).toHaveLength(1);

        await importer(
            [question('QA_IT_QE1', { code_cloture: 'REP_PUB', date_reponse: '2026-07-07', nb_renouvellements: 2 })],
            [attribution('QA_IT_QE1', 0, 'PO855081')],
        );
        expect((await lire()).find((q) => q.uid === 'QA_IT_QE1')).toEqual(
            { uid: 'QA_IT_QE1', type_question: 'QE', code_cloture: 'REP_PUB', date_reponse: '2026-07-07', nb_renouvellements: 2 },
        );
    });

    it('supprimer une question supprime ses ministères attributaires (cascade)', async () => {
        await pool.query('DELETE FROM questions WHERE uid = ANY($1)', [UIDS]);

        expect(await lireAttributions()).toEqual([]);
    });
});
