import { ReunionsExtractor } from './ReunionsExtractor';
import { ROW_HASH_PATTERN, writeTempJsonFile } from './test-helpers/tempJsonFile';

// Extraits réels du jeu « Réunions » (17ᵉ législature), listes raccourcies.
const COMMISSION = {
    reunion: {
        '@xsi:type': 'reunionCommission_type',
        uid: 'RUANR5L17S2024IDC453234',
        timeStampDebut: '2024-07-24T09:30:00.000+02:00',
        timeStampFin: '2024-07-24T09:40:00.000+02:00',
        lieu: { lieuRef: 'SLANPBS6351', libelleLong: 'Salle 6351 – Palais Bourbon, 1ème étage' },
        cycleDeVie: { etat: 'Confirmé', chrono: { creation: '2024-07-20T00:00:00.000+02:00', cloture: null } },
        demandeur: null,
        organeReuniRef: 'PO420120',
        participants: {
            participantsInternes: {
                participantInterne: [
                    { acteurRef: 'PA642764', presence: 'absent' },
                    { acteurRef: 'PA842279', presence: 'excusé' },
                    { acteurRef: 'PA642847', presence: 'présent' },
                ],
            },
            personnesAuditionnees: null,
        },
        visioConference: 'false',
        sessionRef: null,
        ouverturePresse: 'false',
        captationVideo: 'false',
        ODJ: {
            convocationODJ: { item: '– Désignation des rapporteurs\r– Création de missions d’information' },
            resumeODJ: { item: ['désignation des rapporteurs ;', 'création de missions d’information.'] },
            pointsODJ: {
                pointODJ: [
                    {
                        '@xsi:type': 'podjReunion_type',
                        uid: 'RUANR5L17S2024IDC453234PT34405',
                        cycleDeVie: { etat: 'Confirmé', chrono: { creation: '2024-10-11T00:00:00.000+02:00', cloture: null } },
                        objet: 'Nomination des rapporteurs pour avis',
                        procedure: null,
                        dossiersLegislatifsRefs: { dossierRef: ['DLR5L17N50198', 'DLR5L17N50588'] },
                        typePointODJ: 'Nomination rapporteur pour avis',
                        comiteSecret: 'false',
                        textesAssocies: null,
                    },
                    {
                        '@xsi:type': 'podjReunion_type',
                        uid: 'RUANR5L17S2024IDC453234PT34435',
                        cycleDeVie: { etat: 'Supprimé', chrono: { creation: '2024-10-15T00:00:00.000+02:00', cloture: null } },
                        objet: 'Désignation des rapporteurs',
                        procedure: null,
                        dossiersLegislatifsRefs: { dossierRef: 'DLR5L17N50588' },
                        typePointODJ: 'Nomination rapporteur',
                        comiteSecret: 'false',
                        textesAssocies: null,
                    },
                ],
            },
        },
        compteRenduRef: 'CRCANR5L17S2024PO420120N002',
        formatReunion: 'Ordinaire',
        infosReunionsInternationale: { estReunionInternationale: 'false', listePays: null },
    },
};

const SEANCE = {
    reunion: {
        '@xsi:type': 'seance_type',
        uid: 'RUANR5L17S2024IDS28537',
        timeStampDebut: '2024-07-18T15:00:00.000+02:00',
        timeStampFin: '2024-07-18T20:50:00.000+02:00',
        lieu: { lieuRef: 'AN', libelleLong: 'Assemblée nationale' },
        cycleDeVie: { etat: 'Confirmé', chrono: { creation: '2024-07-09T00:00:00.000+02:00', cloture: null } },
        organeReuniRef: 'PO838901',
        participants: null,
        visioConference: 'false',
        sessionRef: 'SCR5A2024D1',
        ouverturePresse: 'true',
        captationVideo: 'true',
        ODJ: {
            convocationODJ: null,
            resumeODJ: null,
            pointsODJ: {
                pointODJ: {
                    '@xsi:type': 'podjSeanceConfPres_type',
                    uid: 'RUANR5L17S2024IDS28537PT48072',
                    cycleDeVie: { etat: 'Confirmé', chrono: { creation: '2024-07-09T00:00:00.000+02:00', cloture: null } },
                    objet: "Ouverture de la XVIIe législature",
                    procedure: null,
                    dossiersLegislatifsRefs: null,
                    typePointODJ: 'Ouverture et clôture de session',
                    comiteSecret: 'false',
                    natureTravauxODJ: 'ODJPR',
                    dateConfPres: '2024-07-18+02:00',
                },
            },
        },
        compteRenduRef: 'CRSANR5L17S2024D1N001',
        identifiants: { numSeanceJO: '1', idJO: '20245001', quantieme: 'Unique', DateSeance: '2024-07-18+02:00' },
    },
};

describe('ReunionsExtractor', () => {
    let cleanups: Array<() => void> = [];

    afterEach(() => {
        cleanups.forEach((c) => c());
        cleanups = [];
    });

    async function extract(...fixtures: unknown[]) {
        const extractor = new ReunionsExtractor(17);
        for (const f of fixtures) {
            const { filePath, cleanup } = writeTempJsonFile(f);
            cleanups.push(cleanup);
            await extractor.processFile(filePath);
        }
        return extractor;
    }

    it('extrait une réunion de commission', async () => {
        const extractor = await extract(COMMISSION);
        const [reunion] = extractor.getTables().reunions;

        expect(reunion).toEqual({
            uid: 'RUANR5L17S2024IDC453234',
            type_reunion: 'commission',
            legislature: 17,
            organe_uid: 'PO420120',
            demandeur_acteur_uid: null,
            demandeur_organe_uid: null,
            etat: 'Confirmé',
            date_debut: '2024-07-24T09:30:00.000+02:00',
            date_fin: '2024-07-24T09:40:00.000+02:00',
            session_ref: null,
            compte_rendu_ref: 'CRCANR5L17S2024PO420120N002',
            lieu_ref: 'SLANPBS6351',
            lieu_libelle: 'Salle 6351 – Palais Bourbon, 1ème étage',
            format_reunion: 'Ordinaire',
            sous_type_reunion: null,
            visio_conference: false,
            captation_video: false,
            ouverture_presse: false,
            est_reunion_internationale: false,
            date_seance: null,
            id_jo: null,
            num_seance_jo: null,
            quantieme: null,
            resume_odj: 'désignation des rapporteurs ;\ncréation de missions d’information.',
            convocation_odj: '– Désignation des rapporteurs\n– Création de missions d’information',
            legislature_snapshot: 17,
            row_hash: expect.stringMatching(ROW_HASH_PATTERN),
        });
    });

    it('extrait la liste de présence des députés convoqués', async () => {
        const extractor = await extract(COMMISSION);
        const participants = extractor.getTables().reunionsParticipants;

        expect(participants.map(({ row_hash, ...p }) => p)).toEqual([
            { reunion_uid: 'RUANR5L17S2024IDC453234', acteur_uid: 'PA642764', presence: 'absent', legislature_snapshot: 17 },
            { reunion_uid: 'RUANR5L17S2024IDC453234', acteur_uid: 'PA842279', presence: 'excusé', legislature_snapshot: 17 },
            { reunion_uid: 'RUANR5L17S2024IDC453234', acteur_uid: 'PA642847', presence: 'présent', legislature_snapshot: 17 },
        ]);
    });

    it('un député listé deux fois garde son statut le plus fort (présent > excusé > absent)', async () => {
        const doublon = structuredClone(COMMISSION);
        doublon.reunion.participants.participantsInternes.participantInterne = [
            { acteurRef: 'PA1', presence: 'absent' },
            { acteurRef: 'PA1', presence: 'présent' },
            { acteurRef: 'PA1', presence: 'excusé' },
        ];
        const extractor = await extract(doublon);

        expect(extractor.getTables().reunionsParticipants.map((p) => [p.acteur_uid, p.presence])).toEqual([['PA1', 'présent']]);
    });

    it('extrait les points de l\'ordre du jour et leurs dossiers (valeur unique ou tableau)', async () => {
        const extractor = await extract(COMMISSION);
        const { reunionsPointsOdj, reunionsPointsOdjDossiers } = extractor.getTables();

        expect(reunionsPointsOdj.map((p) => [p.uid, p.ordre, p.type_point, p.etat, p.comite_secret])).toEqual([
            ['RUANR5L17S2024IDC453234PT34405', 0, 'Nomination rapporteur pour avis', 'Confirmé', false],
            ['RUANR5L17S2024IDC453234PT34435', 1, 'Nomination rapporteur', 'Supprimé', false],
        ]);
        expect(reunionsPointsOdjDossiers.map((d) => [d.point_uid, d.dossier_uid])).toEqual([
            ['RUANR5L17S2024IDC453234PT34405', 'DLR5L17N50198'],
            ['RUANR5L17S2024IDC453234PT34405', 'DLR5L17N50588'],
            ['RUANR5L17S2024IDC453234PT34435', 'DLR5L17N50588'],
        ]);
    });

    it('extrait une séance publique : identifiants JO, point unique, aucune liste de présence', async () => {
        const extractor = await extract(SEANCE);
        const { reunions, reunionsParticipants, reunionsPointsOdj } = extractor.getTables();

        expect(reunions[0]).toMatchObject({
            type_reunion: 'seance',
            organe_uid: 'PO838901',
            session_ref: 'SCR5A2024D1',
            date_seance: '2024-07-18',
            id_jo: '20245001',
            num_seance_jo: 1,
            quantieme: 'Unique',
            ouverture_presse: true,
            resume_odj: null,
            convocation_odj: null,
            est_reunion_internationale: null,
        });
        expect(reunionsParticipants).toEqual([]);
        expect(reunionsPointsOdj).toEqual([
            expect.objectContaining({
                uid: 'RUANR5L17S2024IDS28537PT48072',
                ordre: 0,
                nature_travaux: 'ODJPR',
                date_conf_pres: '2024-07-18',
            }),
        ]);
    });

    it('extrait une réunion à l\'initiative d\'un député, sans organe (législature 16)', async () => {
        // Extrait réel de l'archive 16.
        const initiativeDepute = {
            reunion: {
                '@xsi:type': 'reunionInitParlementaire_type',
                uid: 'RUANR5L15A2022IDF0161271',
                timeStampDebut: '2022-06-27T14:00:00Z',
                timeStampFin: '2022-06-27T15:00:00Z',
                lieu: { lieuRef: 'SLAN101RUSGABR', libelleLong: "Salon Gabriel , 101, rue de l'Université" },
                cycleDeVie: { etat: 'Confirmé', chrono: { creation: '2022-06-20T15:45:34Z', cloture: null } },
                demandeur: { acteur: { nom: 'Mme Anne Genetet', acteurRef: 'PA721024' } },
                organeReuniRef: null,
                participants: null,
                visioConference: null,
                typeReunion: 'DEP',
                ODJ: null,
            },
        };
        const initiativeGroupe = {
            reunion: {
                ...initiativeDepute.reunion,
                uid: 'RU_GP',
                typeReunion: 'GP',
                organeReuniRef: 'PO800490',
                demandeur: { organe: { nom: 'Groupe X', organeRef: 'PO800490' } },
            },
        };
        const extractor = await extract(initiativeDepute, initiativeGroupe);

        expect(extractor.getErrors()).toEqual([]);
        expect(extractor.getTables().reunions.map((r) => [r.uid, r.sous_type_reunion, r.organe_uid, r.demandeur_acteur_uid, r.demandeur_organe_uid]))
            .toEqual([
                ['RUANR5L15A2022IDF0161271', 'DEP', null, 'PA721024', null],
                ['RU_GP', 'GP', 'PO800490', null, 'PO800490'],
            ]);
    });

    it('consigne une erreur pour une réunion sans organe ni demandeur', async () => {
        const orpheline = { reunion: { ...SEANCE.reunion, organeReuniRef: null } };
        const extractor = await extract(orpheline);

        expect(extractor.getErrors()[0].error).toContain('Missing organeReuniRef and demandeur');
    });

    it('consigne une erreur pour un type de réunion inconnu ou un fichier illisible, sans s\'interrompre', async () => {
        const inconnu = { reunion: { ...SEANCE.reunion, '@xsi:type': 'autre_type' } };
        const { filePath, cleanup } = writeTempJsonFile('{ pas du json', { raw: true });
        cleanups.push(cleanup);
        const extractor = await extract(inconnu, COMMISSION);
        await extractor.processFile(filePath);

        expect(extractor.getTables().reunions).toHaveLength(1);
        expect(extractor.getErrors()).toHaveLength(2);
        expect(extractor.getErrors()[0].error).toContain('Unknown reunion type autre_type');
    });

    it('clearTables vide toutes les tables', async () => {
        const extractor = await extract(COMMISSION);
        extractor.clearTables();

        expect(Object.values(extractor.getTables()).every((t) => t.length === 0)).toBe(true);
    });
});
