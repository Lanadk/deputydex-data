import { Pool } from 'pg';
import * as path from 'path';
import { runSqlFile } from '../../../_common/infrastructure/db/sqlRunner';
import { createTestPool } from '../../../_common/infrastructure/db/test-helpers/testDbPool';
import { aggregationScriptsDir } from '../domainAggregation';
import { VIEWS as REUNIONS_VIEWS } from '../reunions/aggregation-oneshot';
import { VIEWS as DEBATS_VIEWS } from '../debats/aggregation-oneshot';
import { VIEWS as SCRUTINS_VIEWS } from '../scrutins/aggregation-oneshot';
import { VIEWS as PRESENCE_VIEWS } from './aggregation-oneshot';

// Chaîne complète de la présence (briques reunions / scrutins / debats → présence)
// sur un mini jeu de données : législature fictive 99, en 2001, pour ne croiser
// aucune autre donnée de la base de test.
const LEG = 99;
const A = 'PA_IT_PRES_A';
const B = 'PA_IT_PRES_B';
const G1 = 'PO_IT_PRES_G1';
const G2 = 'PO_IT_PRES_G2';
const COM = 'PO_IT_PRES_COM';

const CHAINE: Array<[string, readonly string[]]> = [
    ['reunions', REUNIONS_VIEWS],
    ['debats', DEBATS_VIEWS],
    ['scrutins', SCRUTINS_VIEWS],
    ['presence', PRESENCE_VIEWS],
];
const TOUTES_LES_VUES = CHAINE.flatMap(([, views]) => views);

describe('présence : briques par source → mv_deputes_presence_jour → taux (integration)', () => {
    let pool: Pool;
    const h = (s: string) => `it-pres-${s}`;

    async function nettoyer() {
        await pool.query(`DROP MATERIALIZED VIEW IF EXISTS ${[...TOUTES_LES_VUES].reverse().join(', ')} CASCADE`);
        await pool.query(`DELETE FROM debats_comptes_rendus WHERE uid LIKE 'CR_IT_PRES%'`);
        await pool.query(`DELETE FROM reunions WHERE uid LIKE 'RU_IT_PRES%'`);
        await pool.query(`DELETE FROM votes_deputes WHERE scrutin_uid LIKE 'VT_IT_PRES%'`);
        await pool.query(`DELETE FROM scrutins WHERE uid LIKE 'VT_IT_PRES%'`);
        await pool.query(`DELETE FROM deputes WHERE id IN ($1, $2)`, [A, B]);
        await pool.query(`DELETE FROM mandats WHERE uid LIKE 'PM_IT_PRES%'`);
        await pool.query(`DELETE FROM acteurs WHERE uid IN ($1, $2)`, [A, B]);
    }

    const mandat = (uid: string, acteur: string, type: string, organe: string, debut: string, fin: string | null) =>
        pool.query(
            `INSERT INTO mandats (uid, acteur_uid, legislature, type_organe, date_debut, date_fin, mandature_date_prise_fonction,
                                  preseance, nomin_principale, code_qualite, lib_qualite, lib_qualite_sex, organe_uid,
                                  row_hash, legislature_snapshot)
             VALUES ($1, $2, $3, $4, $5, $6, $5, 0, 0, 'Membre', 'Membre', 'Membre', $7, $8, $3)`,
            [uid, acteur, LEG, type, debut, fin, organe, h(uid)]);

    const reunion = (uid: string, type: string, etat: string, debut: string, organe: string | null, dateSeance: string | null) =>
        pool.query(
            `INSERT INTO reunions (uid, type_reunion, organe_uid, etat, date_debut, date_seance, row_hash, legislature_snapshot)
             VALUES ($1, $2, $3, $4, $5::timestamp AT TIME ZONE 'Europe/Paris', $6, $7, $8)`,
            [uid, type, organe, etat, debut, dateSeance, h(uid), LEG]);

    const participant = (reunionUid: string, acteur: string, presence: string) =>
        pool.query(
            `INSERT INTO reunions_participants (reunion_uid, acteur_uid, presence, row_hash, legislature_snapshot)
             VALUES ($1, $2, $3, $4, $5)`, [reunionUid, acteur, presence, h(`${reunionUid}-${acteur}`), LEG]);

    const scrutin = (uid: string, date: string) =>
        pool.query(`INSERT INTO scrutins (uid, date_scrutin, row_hash, legislature_snapshot) VALUES ($1, $2, $3, $4)`,
            [uid, date, h(uid), LEG]);

    const vote = (scrutinUid: string, acteur: string, delegation: boolean) =>
        pool.query(
            `INSERT INTO votes_deputes (scrutin_uid, depute_id, position, par_delegation, row_hash, legislature_snapshot)
             VALUES ($1, $2, 'pour', $3, $4, $5)`, [scrutinUid, acteur, delegation || null, h(`${scrutinUid}-${acteur}`), LEG]);

    beforeAll(async () => {
        pool = createTestPool();
        await nettoyer();

        for (const a of [A, B]) {
            await pool.query(`INSERT INTO acteurs (uid, row_hash, legislature_snapshot) VALUES ($1, $2, $3)`, [a, h(a), LEG]);
            await pool.query(`INSERT INTO deputes (id, row_hash, legislature_snapshot) VALUES ($1, $2, $3)`, [a, h(`d-${a}`), LEG]);
        }
        // A : député dès le 1er janvier, groupe G1 puis G2 à partir du 16, membre de la commission.
        await mandat('PM_IT_PRES_A_AN', A, 'ASSEMBLEE', 'PO_IT_PRES_AN', '2001-01-01', null);
        await mandat('PM_IT_PRES_A_G1', A, 'GP', G1, '2001-01-01', '2001-01-15');
        await mandat('PM_IT_PRES_A_G2', A, 'GP', G2, '2001-01-16', null);
        await mandat('PM_IT_PRES_A_COM', A, 'COMPER', COM, '2001-01-01', null);
        // B : député à partir du 10 (arrivé en cours de législature), groupe G1, pas membre de la commission.
        await mandat('PM_IT_PRES_B_AN', B, 'ASSEMBLEE', 'PO_IT_PRES_AN', '2001-01-10', null);
        await mandat('PM_IT_PRES_B_G1', B, 'GP', G1, '2001-01-10', null);

        // Agenda : séances le 7 (scrutin), le 8 (sans scrutin, compte rendu), le 20 (scrutin) ; une supprimée ;
        // une « Confirmé » le 15 jamais tenue (ni compte rendu ni scrutin, comme une séance annulée) ; une à venir.
        // Le calendrier des séances vient des comptes rendus et des scrutins, pas de l'agenda : le 15 n'apparaît pas.
        await reunion('RU_IT_PRES_S07', 'seance', 'Confirmé', '2001-01-07 15:00', 'PO_IT_PRES_AN', '2001-01-07');
        await reunion('RU_IT_PRES_S08', 'seance', 'Confirmé', '2001-01-08 15:00', 'PO_IT_PRES_AN', '2001-01-08');
        await reunion('RU_IT_PRES_S09', 'seance', 'Supprimé', '2001-01-09 15:00', 'PO_IT_PRES_AN', '2001-01-09');
        await reunion('RU_IT_PRES_S15', 'seance', 'Confirmé', '2001-01-15 15:00', 'PO_IT_PRES_AN', '2001-01-15');
        await reunion('RU_IT_PRES_S20', 'seance', 'Confirmé', '2001-01-20 15:00', 'PO_IT_PRES_AN', '2001-01-20');
        await reunion('RU_IT_PRES_S_FUTUR', 'seance', 'Confirmé', '2099-01-01 15:00', 'PO_IT_PRES_AN', '2099-01-01');
        // Commission le 21 : A (membre) présent, B (non membre) présent. Réunion à venir pré-remplie : A absent.
        await reunion('RU_IT_PRES_C21', 'commission', 'Confirmé', '2001-01-21 10:00', COM, null);
        await participant('RU_IT_PRES_C21', A, 'présent');
        await participant('RU_IT_PRES_C21', B, 'présent');
        await reunion('RU_IT_PRES_C_FUTUR', 'commission', 'Confirmé', '2099-02-01 10:00', COM, null);
        await participant('RU_IT_PRES_C_FUTUR', A, 'absent');

        // Scrutins le 7 et le 20 : A vote le 7, le 20 seulement par délégation ; B vote le 20.
        await scrutin('VT_IT_PRES_1', '2001-01-07');
        await scrutin('VT_IT_PRES_2', '2001-01-20');
        await vote('VT_IT_PRES_1', A, false);
        await vote('VT_IT_PRES_2', A, true);
        await vote('VT_IT_PRES_2', B, false);

        // Débat du 8 (sans scrutin) : A prend la parole.
        await pool.query(
            `INSERT INTO debats_comptes_rendus (uid, seance_uid, date_seance, row_hash, legislature_snapshot)
             VALUES ('CR_IT_PRES_08', 'RU_IT_PRES_S08', '2001-01-08 15:00'::timestamp AT TIME ZONE 'Europe/Paris', $1, $2)`, [h('cr08'), LEG]);
        await pool.query(
            `INSERT INTO debats_interventions (id, compte_rendu_uid, acteur_uid, code_grammaire, row_hash, legislature_snapshot)
             VALUES ('IT_PRES_P1', 'CR_IT_PRES_08', $1, 'PAROLE_GENERIQUE', $2, $3)`, [A, h('p1'), LEG]);
        await pool.query(
            `INSERT INTO debats_interventions_orateurs (intervention_id, ordre, acteur_uid, row_hash, legislature_snapshot)
             VALUES ('IT_PRES_P1', 0, $1, $2, $3)`, [A, h('o1'), LEG]);

        for (const [domain, views] of CHAINE) {
            for (const view of views) await runSqlFile(pool, path.join(aggregationScriptsDir(domain), `${view}.sql`));
        }
    });

    afterAll(async () => {
        await nettoyer();
        await pool.end();
    });

    it('mv_deputes_presence_jour : jours attendus, présence par source, groupe du jour', async () => {
        const jours = (await pool.query(
            `SELECT acteur_uid, to_char(jour, 'MM-DD') AS jour, groupe_uid, seance_observable, attendu, present,
                    present_seance, present_commission, votes_personnels, votes_par_delegation, convocations, presences_hors_mandat
             FROM mv_deputes_presence_jour WHERE legislature = $1 ORDER BY acteur_uid, jour`, [LEG])).rows;

        expect(jours).toEqual([
            // A : vote le 7 (présent) ; le 8 parole un jour sans scrutin (présent, non attendu) ;
            // le 20 vote par délégation seulement (absent) ; le 21 commission (présent).
            { acteur_uid: A, jour: '01-07', groupe_uid: G1, seance_observable: true, attendu: true, present: true, present_seance: true, present_commission: false, votes_personnels: 1, votes_par_delegation: 0, convocations: 0, presences_hors_mandat: 0 },
            { acteur_uid: A, jour: '01-08', groupe_uid: G1, seance_observable: false, attendu: false, present: true, present_seance: true, present_commission: false, votes_personnels: 0, votes_par_delegation: 0, convocations: 0, presences_hors_mandat: 0 },
            { acteur_uid: A, jour: '01-20', groupe_uid: G2, seance_observable: true, attendu: true, present: false, present_seance: false, present_commission: false, votes_personnels: 0, votes_par_delegation: 1, convocations: 0, presences_hors_mandat: 0 },
            { acteur_uid: A, jour: '01-21', groupe_uid: G2, seance_observable: false, attendu: true, present: true, present_seance: false, present_commission: true, votes_personnels: 0, votes_par_delegation: 0, convocations: 1, presences_hors_mandat: 0 },
            // B : arrivé le 10 (rien avant) ; vote le 20 ; présent le 21 à une commission dont il n'est pas membre.
            { acteur_uid: B, jour: '01-20', groupe_uid: G1, seance_observable: true, attendu: true, present: true, present_seance: true, present_commission: false, votes_personnels: 1, votes_par_delegation: 0, convocations: 0, presences_hors_mandat: 0 },
            { acteur_uid: B, jour: '01-21', groupe_uid: G1, seance_observable: false, attendu: false, present: true, present_seance: false, present_commission: true, votes_personnels: 0, votes_par_delegation: 0, convocations: 0, presences_hors_mandat: 1 },
        ]);
    });

    it('agg_deputes_presence : taux global, séance, commission, scrutins', async () => {
        const rows = (await pool.query(
            `SELECT acteur_uid, jours_attendus, jours_presents, taux_presence::float, taux_presence_seance::float,
                    taux_presence_commission::float, taux_participation_scrutins::float, votes_par_delegation, jours_presence_non_attendus
             FROM agg_deputes_presence WHERE legislature = $1 ORDER BY acteur_uid`, [LEG])).rows;

        expect(rows).toEqual([
            { acteur_uid: A, jours_attendus: 3, jours_presents: 2, taux_presence: 66.7, taux_presence_seance: 50, taux_presence_commission: 100, taux_participation_scrutins: 50, votes_par_delegation: 1, jours_presence_non_attendus: 1 },
            { acteur_uid: B, jours_attendus: 1, jours_presents: 1, taux_presence: 100, taux_presence_seance: 100, taux_presence_commission: null, taux_participation_scrutins: 100, votes_par_delegation: 0, jours_presence_non_attendus: 1 },
        ]);
    });

    it('volume : jours de présence toutes sources (attendus ou non), par source, moyenne par mois actif', async () => {
        const rows = (await pool.query(
            `SELECT acteur_uid, jours_presence, jours_vote, jours_debat, jours_commission, mois_actifs, jours_presence_par_mois::float
             FROM agg_deputes_presence WHERE legislature = $1 ORDER BY acteur_uid`, [LEG])).rows;

        expect(rows).toEqual([
            // A : vote le 7, parole le 8 (hors taux), commission le 21 ; le 20 (délégation) ne compte pas.
            { acteur_uid: A, jours_presence: 3, jours_vote: 1, jours_debat: 1, jours_commission: 1, mois_actifs: 1, jours_presence_par_mois: 3 },
            // B : vote le 20, commission (hors mandat) le 21.
            { acteur_uid: B, jours_presence: 2, jours_vote: 1, jours_debat: 0, jours_commission: 1, mois_actifs: 1, jours_presence_par_mois: 2 },
        ]);

        const assemblee = (await pool.query(
            `SELECT jours_presence, mois_deputes_actifs, jours_presence_par_mois::float FROM agg_assemblee_presence WHERE legislature = $1`, [LEG])).rows;
        expect(assemblee).toEqual([{ jours_presence: 5, mois_deputes_actifs: 2, jours_presence_par_mois: 2.5 }]);

        const mensuelle = (await pool.query(
            `SELECT jours_presence, jours_presence_par_depute::float FROM agg_assemblee_presence_mensuelle WHERE legislature = $1`, [LEG])).rows;
        expect(mensuelle).toEqual([{ jours_presence: 5, jours_presence_par_depute: 2.5 }]);
    });

    it('agg_deputes_presence_annuelle : année civile, parlementaire (oct. → sept.) et de mandat', async () => {
        const rows = (await pool.query(
            `SELECT acteur_uid, type_periode, periode, to_char(periode_debut, 'YYYY-MM-DD') AS debut,
                    to_char(periode_fin, 'YYYY-MM-DD') AS fin, jours_presence, taux_presence::float
             FROM agg_deputes_presence_annuelle WHERE legislature = $1 ORDER BY acteur_uid, type_periode`, [LEG])).rows;

        expect(rows).toEqual([
            { acteur_uid: A, type_periode: 'civile', periode: '2001', debut: '2001-01-01', fin: '2001-12-31', jours_presence: 3, taux_presence: 66.7 },
            { acteur_uid: A, type_periode: 'mandat', periode: '1', debut: '2001-01-01', fin: '2001-12-31', jours_presence: 3, taux_presence: 66.7 },
            { acteur_uid: A, type_periode: 'parlementaire', periode: '2000-2001', debut: '2000-10-01', fin: '2001-09-30', jours_presence: 3, taux_presence: 66.7 },
            { acteur_uid: B, type_periode: 'civile', periode: '2001', debut: '2001-01-01', fin: '2001-12-31', jours_presence: 2, taux_presence: 100 },
            // Année de mandat de B : depuis sa propre prise de fonction (10 janvier).
            { acteur_uid: B, type_periode: 'mandat', periode: '1', debut: '2001-01-10', fin: '2002-01-09', jours_presence: 2, taux_presence: 100 },
            { acteur_uid: B, type_periode: 'parlementaire', periode: '2000-2001', debut: '2000-10-01', fin: '2001-09-30', jours_presence: 2, taux_presence: 100 },
        ]);
    });

    it('agg_groupes / agg_assemblee _annuelle : années civile et parlementaire seulement (pas de mandat)', async () => {
        const groupes = (await pool.query(
            `SELECT groupe_uid, type_periode, periode, jours_presence, taux_presence::float
             FROM agg_groupes_presence_annuelle WHERE legislature = $1 ORDER BY groupe_uid, type_periode`, [LEG])).rows;
        expect(groupes).toEqual([
            { groupe_uid: G1, type_periode: 'civile', periode: '2001', jours_presence: 4, taux_presence: 100 },
            { groupe_uid: G1, type_periode: 'parlementaire', periode: '2000-2001', jours_presence: 4, taux_presence: 100 },
            { groupe_uid: G2, type_periode: 'civile', periode: '2001', jours_presence: 1, taux_presence: 50 },
            { groupe_uid: G2, type_periode: 'parlementaire', periode: '2000-2001', jours_presence: 1, taux_presence: 50 },
        ]);

        const assemblee = (await pool.query(
            `SELECT type_periode, periode, jours_presence, jours_presence_par_mois::float, taux_presence::float
             FROM agg_assemblee_presence_annuelle WHERE legislature = $1 ORDER BY type_periode`, [LEG])).rows;
        expect(assemblee).toEqual([
            { type_periode: 'civile', periode: '2001', jours_presence: 5, jours_presence_par_mois: 2.5, taux_presence: 75 },
            { type_periode: 'parlementaire', periode: '2000-2001', jours_presence: 5, jours_presence_par_mois: 2.5, taux_presence: 75 },
        ]);
    });

    it('agg_assemblee_presence_jour et _jour_semaine : une ligne par jour, puis le rythme de la semaine', async () => {
        const jours = (await pool.query(
            `SELECT to_char(jour, 'MM-DD') AS jour, jour_semaine, seance_observable, deputes_attendus, deputes_presents,
                    deputes_en_seance, deputes_en_mandat, deputes_presents_total, scrutins
             FROM agg_assemblee_presence_jour WHERE legislature = $1 ORDER BY jour`, [LEG])).rows;
        expect(jours).toEqual([
            // 7 janvier 2001 : un dimanche (ISO 7) — jours fictifs, seul l'enchaînement compte ici.
            { jour: '01-07', jour_semaine: 7, seance_observable: true, deputes_attendus: 1, deputes_presents: 1, deputes_en_seance: 1, deputes_en_mandat: 1, deputes_presents_total: 1, scrutins: 1 },
            { jour: '01-08', jour_semaine: 1, seance_observable: false, deputes_attendus: 0, deputes_presents: 0, deputes_en_seance: 0, deputes_en_mandat: null, deputes_presents_total: 1, scrutins: 0 },
            { jour: '01-20', jour_semaine: 6, seance_observable: true, deputes_attendus: 2, deputes_presents: 1, deputes_en_seance: 1, deputes_en_mandat: 2, deputes_presents_total: 1, scrutins: 1 },
            { jour: '01-21', jour_semaine: 7, seance_observable: false, deputes_attendus: 1, deputes_presents: 1, deputes_en_seance: 0, deputes_en_mandat: null, deputes_presents_total: 2, scrutins: 0 },
        ]);

        const semaine = (await pool.query(
            `SELECT jour_semaine, jours, jours_seance, taux_presence::float, taux_presence_seance::float
             FROM agg_assemblee_presence_jour_semaine WHERE legislature = $1 ORDER BY jour_semaine`, [LEG])).rows;
        expect(semaine).toEqual([
            { jour_semaine: 1, jours: 0, jours_seance: 0, taux_presence: null, taux_presence_seance: null },
            { jour_semaine: 6, jours: 1, jours_seance: 1, taux_presence: 50, taux_presence_seance: 50 },
            // Dimanches : le 7 (séance, 1/1) et le 21 (commission, 1/1).
            { jour_semaine: 7, jours: 2, jours_seance: 1, taux_presence: 100, taux_presence_seance: 100 },
        ]);
    });

    it('agg_groupes_presence : chaque jour compte pour le groupe du député ce jour-là (taux pondérés)', async () => {
        const rows = (await pool.query(
            `SELECT groupe_uid, nb_deputes, jours_attendus, jours_presents, taux_presence::float
             FROM agg_groupes_presence WHERE legislature = $1 ORDER BY groupe_uid`, [LEG])).rows;

        expect(rows).toEqual([
            { groupe_uid: G1, nb_deputes: 2, jours_attendus: 2, jours_presents: 2, taux_presence: 100 }, // A le 7, B le 20
            { groupe_uid: G2, nb_deputes: 1, jours_attendus: 2, jours_presents: 1, taux_presence: 50 }, // A le 20 (délégation), le 21
        ]);
    });

    it('agg_assemblee_presence et les vues mensuelles', async () => {
        const assemblee = (await pool.query(
            `SELECT jours_attendus, jours_presents, taux_presence::float, effectif_moyen::float FROM agg_assemblee_presence WHERE legislature = $1`, [LEG])).rows;
        // Effectif moyen : 1 député le 7 (B pas encore élu), 2 le 20 → 1,5.
        expect(assemblee).toEqual([{ jours_attendus: 4, jours_presents: 3, taux_presence: 75, effectif_moyen: 1.5 }]);

        const mensuelle = (await pool.query(
            `SELECT to_char(mois, 'YYYY-MM') AS mois, jours_attendus, taux_presence::float FROM agg_assemblee_presence_mensuelle WHERE legislature = $1`, [LEG])).rows;
        expect(mensuelle).toEqual([{ mois: '2001-01', jours_attendus: 4, taux_presence: 75 }]);

        const deputeMensuel = (await pool.query(
            `SELECT acteur_uid, taux_presence::float FROM agg_deputes_presence_mensuelle WHERE legislature = $1 ORDER BY acteur_uid`, [LEG])).rows;
        expect(deputeMensuel).toEqual([{ acteur_uid: A, taux_presence: 66.7 }, { acteur_uid: B, taux_presence: 100 }]);
    });
});
