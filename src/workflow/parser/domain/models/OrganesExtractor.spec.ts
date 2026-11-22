import { OrganesExtractor } from './OrganesExtractor';
import { ROW_HASH_PATTERN, writeTempJsonFile } from './test-helpers/tempJsonFile';

const NIL = { '@xsi:nil': 'true', '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance' };

// Extraits réels du jeu AMO (17ᵉ législature).
const COMMISSION = {
    organe: {
        '@xsi:type': 'OrganeParlementaire_Type',
        uid: 'PO59048',
        codeType: 'COMPER',
        libelle: "Commission des finances, de l'économie générale et du contrôle budgétaire",
        libelleEdition: 'de la commission des finances',
        libelleAbrege: 'Finances',
        libelleAbrev: 'CION_FIN',
        viMoDe: { dateDebut: '1958-12-09', dateAgrement: null, dateFin: null },
        organeParent: null,
        legislature: null,
    },
};

const MINISTERE = {
    organe: {
        '@xsi:type': 'OrganeExterne_Type',
        uid: 'PO873431',
        codeType: 'MINISTERE',
        libelle: "Ministère de l'intérieur",
        libelleEdition: "de l'intérieur",
        libelleAbrege: 'Intérieur',
        libelleAbrev: 'INT',
        viMoDe: { dateDebut: '2025-10-05', dateAgrement: null, dateFin: '2025-10-10' },
        organeParent: 'PO873418',
        preseance: '5',
        organePrecedentRef: 'PO855077',
    },
};

describe('OrganesExtractor', () => {
    let cleanups: Array<() => void> = [];

    afterEach(() => {
        cleanups.forEach((c) => c());
        cleanups = [];
    });

    async function extract(...fixtures: unknown[]) {
        const extractor = new OrganesExtractor(17);
        for (const f of fixtures) {
            const { filePath, cleanup } = writeTempJsonFile(f);
            cleanups.push(cleanup);
            await extractor.processFile(filePath);
        }
        return extractor;
    }

    it('extrait une commission permanente (organe permanent, sans parent ni préséance)', async () => {
        const extractor = await extract(COMMISSION);
        const [organe] = extractor.getTables().organes;

        expect(organe).toEqual({
            uid: 'PO59048',
            code_type: 'COMPER',
            libelle: "Commission des finances, de l'économie générale et du contrôle budgétaire",
            libelle_edition: 'de la commission des finances',
            libelle_abrege: 'Finances',
            libelle_abrev: 'CION_FIN',
            date_debut: '1958-12-09',
            date_fin: null,
            organe_parent_uid: null,
            organe_precedent_uid: null,
            preseance: null,
            legislature: null,
            legislature_snapshot: 17,
            row_hash: expect.stringMatching(ROW_HASH_PATTERN),
        });
        expect(extractor.getErrors()).toEqual([]);
    });

    it('extrait un ministère : gouvernement parent, préséance, ministère précédent', async () => {
        const extractor = await extract(MINISTERE);

        expect(extractor.getTables().organes[0]).toMatchObject({
            uid: 'PO873431',
            code_type: 'MINISTERE',
            libelle_abrege: 'Intérieur',
            date_fin: '2025-10-10',
            organe_parent_uid: 'PO873418',
            organe_precedent_uid: 'PO855077',
            preseance: 5,
        });
    });

    it('normalise les valeurs xsi:nil et les entiers invalides à null', async () => {
        const extractor = await extract({
            organe: { ...COMMISSION.organe, uid: 'PO1', libelleAbrege: NIL, preseance: NIL, legislature: 'abc' },
        });

        expect(extractor.getTables().organes[0]).toMatchObject({ libelle_abrege: null, preseance: null, legislature: null });
    });

    it('lit une législature numérique', async () => {
        const extractor = await extract({ organe: { ...COMMISSION.organe, uid: 'PO2', codeType: 'GP', legislature: '17' } });

        expect(extractor.getTables().organes[0].legislature).toBe(17);
    });

    it('la même donnée donne la même empreinte ; une donnée différente, une autre', async () => {
        const a = (await extract(COMMISSION)).getTables().organes[0].row_hash;
        const b = (await extract(COMMISSION)).getTables().organes[0].row_hash;
        const c = (await extract({ organe: { ...COMMISSION.organe, libelleAbrege: 'Budget' } })).getTables().organes[0].row_hash;

        expect(a).toBe(b);
        expect(c).not.toBe(a);
    });

    it('consigne une erreur (sans interrompre) pour un fichier sans uid ou sans type, ou illisible', async () => {
        const extractor = new OrganesExtractor(17);
        for (const [data, raw] of [[{ organe: { codeType: 'GP' } }, false], [{ organe: { uid: 'PO3' } }, false], ['{pas du json', true]] as const) {
            const { filePath, cleanup } = writeTempJsonFile(data, { raw });
            cleanups.push(cleanup);
            await extractor.processFile(filePath);
        }

        expect(extractor.getTables().organes).toEqual([]);
        expect(extractor.getErrors().map((e) => e.error)).toEqual([
            'Missing uid',
            'Missing codeType for PO3',
            expect.any(String),
        ]);
    });

    it('clearTables vide les organes accumulés', async () => {
        const extractor = await extract(COMMISSION, MINISTERE);
        expect(extractor.getTables().organes).toHaveLength(2);

        extractor.clearTables();

        expect(extractor.getTables().organes).toEqual([]);
    });
});
