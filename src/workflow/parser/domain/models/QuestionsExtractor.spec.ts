import { QuestionsExtractor } from './QuestionsExtractor';
import { ROW_HASH_PATTERN, writeTempJsonFile } from './test-helpers/tempJsonFile';

const infoJO = (dateJO: string, typeJO = 'JO_QUESTION', pageJO: string | null = null) => ({
    typeJO, dateJO, pageJO, numJO: null, urlLegifrance: null, referenceNOR: null,
});

const AUTEUR = {
    identite: { acteurRef: 'PA721486', mandatRef: 'PM843614' },
    groupe: { organeRef: 'PO845485', abrege: 'LIOT', developpe: 'Libertés, Indépendants, Outre-mer et Territoires' },
};

// Extraits réels (17ᵉ législature), textes raccourcis.
const QUESTION_ECRITE = {
    question: {
        '@xsi:type': 'QuestionEcrite_Type',
        uid: 'QANR5L17QE10065',
        identifiant: { numero: '10065', regime: '5eme Republique', legislature: '17' },
        type: 'QE',
        indexationAN: { rubrique: 'enfants', teteAnalyse: null, analyses: { analyse: 'Conséquences de la réforme du CMG' } },
        auteur: AUTEUR,
        minInt: { organeRef: 'PO855081', abrege: 'Travail, santé, solidarités et familles', developpe: 'Ministère du travail…' },
        minAttribs: {
            minAttrib: [
                { infoJO: infoJO('2025-10-07'), denomination: { organeRef: 'PO855081', abrege: 'Travail, santé, solidarités et familles' } },
                { infoJO: infoJO('2025-10-13', 'JO_LOI_DECRET'), denomination: { organeRef: 'PO873673', abrege: 'Santé, familles, autonomie et personnes handicapées' } },
            ],
        },
        textesQuestion: { texteQuestion: { infoJO: infoJO('2025-10-07', 'JO_QUESTION', '8428'), texte: "M. Christophe Naegelen attire l'attention…" } },
        textesReponse: { texteReponse: { infoJO: infoJO('2026-07-07', 'JO_QUESTION', '6390'), texte: 'La réforme du CMG a pour objectif…' } },
        cloture: { codeCloture: 'REP_PUB', libelleCloture: 'Réponse publiée', dateCloture: '2026-07-07', infoJO: infoJO('2026-07-07') },
        signalement: { dateDepotSignal: '2026-05-25', infoJO: infoJO('2026-05-26') },
        renouvellements: { renouvellement: [{ infoJO: infoJO('2026-04-21') }, { infoJO: infoJO('2026-01-13') }] },
    },
};

const QUESTION_GOUVERNEMENT = {
    question: {
        '@xsi:type': 'QuestionGouvernement_Type',
        uid: 'QANR5L17QG1',
        identifiant: { numero: '1', regime: '5eme Republique', legislature: '17' },
        type: 'QG',
        indexationAN: { rubrique: 'outre-mer', teteAnalyse: null, analyses: { analyse: 'Situation à Mayotte' } },
        auteur: { identite: { acteurRef: 'PA842279', mandatRef: 'PM843779' }, groupe: { organeRef: 'PO845401', abrege: 'RN' } },
        minInt: { organeRef: 'PO847643', abrege: 'Intérieur', developpe: "Ministère de l'intérieur" },
        minAttribs: { minAttrib: { infoJO: infoJO('2024-10-03', 'JO_DEBAT'), denomination: { organeRef: 'PO847643', abrege: 'Intérieur' } } },
        textesQuestion: null,
        textesReponse: {
            texteReponse: { infoJO: infoJO('2024-10-03', 'JO_DEBAT', '5283'), texte: '<strong>Mme la présidente . </strong>La parole est à Mme Anchya Bamana.' },
        },
        cloture: { codeCloture: 'REP_PUB', libelleCloture: 'Réponse publiée', dateCloture: '2024-10-03', infoJO: infoJO('2024-10-03', 'JO_DEBAT') },
    },
};

describe('QuestionsExtractor', () => {
    let cleanups: Array<() => void> = [];

    afterEach(() => {
        cleanups.forEach((c) => c());
        cleanups = [];
    });

    async function extract(...fixtures: unknown[]) {
        const extractor = new QuestionsExtractor(17);
        for (const f of fixtures) {
            const { filePath, cleanup } = writeTempJsonFile(f);
            cleanups.push(cleanup);
            await extractor.processFile(filePath);
        }
        return extractor;
    }

    it('extrait une question écrite (réponse, renouvellements, signalement)', async () => {
        const extractor = await extract(QUESTION_ECRITE);

        expect(extractor.getTables().questions).toEqual([{
            uid: 'QANR5L17QE10065',
            type_question: 'QE',
            legislature: 17,
            numero: 10065,
            acteur_uid: 'PA721486',
            mandat_uid: 'PM843614',
            groupe_uid: 'PO845485',
            groupe_abrege: 'LIOT',
            rubrique: 'enfants',
            tete_analyse: null,
            libelle_analyse: 'Conséquences de la réforme du CMG',
            ministere_uid: 'PO855081',
            ministere_abrege: 'Travail, santé, solidarités et familles',
            date_question: '2025-10-07',
            texte_question: "M. Christophe Naegelen attire l'attention…",
            date_reponse: '2026-07-07',
            type_jo_reponse: 'JO_QUESTION',
            page_jo_reponse: '6390',
            texte_reponse: 'La réforme du CMG a pour objectif…',
            code_cloture: 'REP_PUB',
            libelle_cloture: 'Réponse publiée',
            date_cloture: '2026-07-07',
            nb_renouvellements: 2,
            date_dernier_renouvellement: '2026-04-21',
            date_signalement: '2026-05-25',
            legislature_snapshot: 17,
            row_hash: expect.stringMatching(ROW_HASH_PATTERN),
        }]);
    });

    it('extrait les ministères attributaires dans l\'ordre de la source (valeur unique ou tableau)', async () => {
        const extractor = await extract(QUESTION_ECRITE, QUESTION_GOUVERNEMENT);

        expect(extractor.getTables().questionsMinisteresAttributaires.map(({ row_hash, ...m }) => m)).toEqual([
            { question_uid: 'QANR5L17QE10065', ordre: 0, ministere_uid: 'PO855081', ministere_abrege: 'Travail, santé, solidarités et familles', date_jo: '2025-10-07', legislature_snapshot: 17 },
            { question_uid: 'QANR5L17QE10065', ordre: 1, ministere_uid: 'PO873673', ministere_abrege: 'Santé, familles, autonomie et personnes handicapées', date_jo: '2025-10-13', legislature_snapshot: 17 },
            { question_uid: 'QANR5L17QG1', ordre: 0, ministere_uid: 'PO847643', ministere_abrege: 'Intérieur', date_jo: '2024-10-03', legislature_snapshot: 17 },
        ]);
    });

    it('une question au Gouvernement n\'a pas de texte de question : la réponse en séance porte la date', async () => {
        const extractor = await extract(QUESTION_GOUVERNEMENT);

        expect(extractor.getTables().questions[0]).toMatchObject({
            type_question: 'QG',
            date_question: null,
            texte_question: null,
            date_reponse: '2024-10-03',
            type_jo_reponse: 'JO_DEBAT',
            page_jo_reponse: '5283',
            nb_renouvellements: 0,
            date_dernier_renouvellement: null,
            date_signalement: null,
        });
    });

    it('un erratum (plusieurs publications) garde la première publication avec un texte', async () => {
        const erratum = structuredClone(QUESTION_ECRITE);
        (erratum.question.textesQuestion as any).texteQuestion = [
            { infoJO: infoJO('2026-04-14', 'JO_QUESTION', '3061'), texte: 'Texte d’origine' },
            { infoJO: infoJO('2026-04-21', 'JO_QUESTION', '3536'), texte: null, erratum: 'Au lieu de…' },
        ];
        const extractor = await extract(erratum);

        expect(extractor.getTables().questions[0]).toMatchObject({ date_question: '2026-04-14', texte_question: 'Texte d’origine' });
    });

    it('une question sans clôture (en attente de réponse) a des champs de clôture et de réponse nuls', async () => {
        const enAttente = structuredClone(QUESTION_ECRITE);
        const q = enAttente.question as any;
        q.cloture = null;
        q.textesReponse = null;
        const extractor = await extract(enAttente);

        expect(extractor.getTables().questions[0]).toMatchObject({
            code_cloture: null, libelle_cloture: null, date_cloture: null,
            date_reponse: null, type_jo_reponse: null, texte_reponse: null,
        });
    });

    it('consigne une erreur pour un type inconnu ou un fichier illisible, sans s\'interrompre', async () => {
        const inconnu = { question: { ...QUESTION_GOUVERNEMENT.question, type: 'QX' } };
        const { filePath, cleanup } = writeTempJsonFile('{ pas du json', { raw: true });
        cleanups.push(cleanup);
        const extractor = await extract(inconnu, QUESTION_ECRITE);
        await extractor.processFile(filePath);

        expect(extractor.getTables().questions).toHaveLength(1);
        expect(extractor.getErrors()).toHaveLength(2);
        expect(extractor.getErrors()[0].error).toContain('Unknown question type QX');
    });

    it('clearTables vide toutes les tables', async () => {
        const extractor = await extract(QUESTION_ECRITE);
        extractor.clearTables();

        expect(Object.values(extractor.getTables()).every((t) => t.length === 0)).toBe(true);
    });
});
