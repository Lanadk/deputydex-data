import { DebatsExtractor, texteBrut } from './DebatsExtractor';
import { ROW_HASH_PATTERN, writeTempJsonFile } from './test-helpers/tempJsonFile';

// Compte rendu réduit, construit à partir d'extraits réels (17ᵉ législature).
const COMPTE_RENDU = `<?xml version='1.0' encoding='UTF-8'?>
<compteRendu xmlns="http://schemas.assemblee-nationale.fr/referentiel">
  <uid>CRSANR5L17S2024D1N001</uid>
  <seanceRef>RUANR5L17S2024IDS28537</seanceRef>
  <sessionRef>SCR5A2024D1</sessionRef>
  <metadonnees>
    <dateSeance>20240718150000000</dateSeance>
    <dateSeanceJour>jeudi 18 juillet 2024</dateSeanceJour>
    <numSeanceJour>Unique</numSeanceJour>
    <numSeance>1</numSeance>
    <legislature>17</legislature>
    <session>Session de droit juillet 2024</session>
    <nomFichierJo>20245001</nomFichierJo>
    <validite>valide</validite>
    <etat>complet</etat>
    <version>avant_JO</version>
  </metadonnees>
  <contenu>
    <quantiemes><journee>Séance du jeudi 18 juillet 2024</journee></quantiemes>
    <ouvertureSeance nivpoint="1" ordre_absolu_seance="1" id_syceron="3508735">
      <orateurs/>
      <texte>Présidence de M. José Gonzalez, doyen d’âge</texte>
      <paragraphe ordre_absolu_seance="2" id_acteur="PA793362" id_mandat="PM842465" code_grammaire="OUV_SEAN_2_1" code_style="NORMAL" id_syceron="3508736" roledebat="president">
        <orateurs><orateur><nom>M. le président</nom><id>793362</id><qualite/></orateur></orateurs>
        <texte stime="1099.79">La séance est ouverte.</texte>
      </paragraphe>
    </ouvertureSeance>
    <point nivpoint="1" valeur_ptsodj="3" ordre_absolu_seance="11" code_grammaire="TITRE_TEXTE_DISCUSSION" id_syceron="3508745">
      <orateurs/>
      <texte>Ouverture de la XVII<exposant>e </exposant>législature</texte>
      <paragraphe ordre_absolu_seance="12" id_acteur="PA793362" id_mandat="PM842465" code_grammaire="ODJ_APPEL_DISCUSSION" code_style="NORMAL" id_syceron="3508746" roledebat="president">
        <orateurs><orateur><nom>M. le président</nom><id>793362</id><qualite/></orateur></orateurs>
        <texte stime="1159.97">Aux termes de l’article 1<exposant>er </exposant>du règlement, les six plus jeunes députés &amp; secrétaires…<br/> Le bureau d’âge est ainsi constitué. <italique>(Applaudissements.)</italique></texte>
      </paragraphe>
      <point nivpoint="2" ordre_absolu_seance="20" code_grammaire="DISC_ARTICLES_3_1" id_syceron="3509000">
        <orateurs/>
        <texte>Article 1<exposant>er</exposant></texte>
        <paragraphe ordre_absolu_seance="21" id_acteur="PA795746" id_mandat="PM843000" code_grammaire="DISC_ARTICLES_3_4_1" code_style="NORMAL" id_syceron="3509001" type_debat="ADT" bibard="1640" art="1er" adt="13" ssadt="" decision="Rejeté">
          <orateurs><orateur><nom>M. Antoine Léaument</nom><id>795746</id><qualite/></orateur></orateurs>
          <texte stime="2000.5">Je défends l’amendement no 13.</texte>
        </paragraphe>
        <interExtraction>
          <paragraphe ordre_absolu_seance="22" id_acteur="PA0" code_grammaire="INTERRUPTION_1_10" code_style="NORMAL" id_syceron="3509002">
            <orateurs>
              <orateur><nom>M. Erwan Balanant</nom><id>719558</id><qualite/></orateur>
              <orateur><nom>M. François Bayrou</nom><id>-125869</id><qualite>premier ministre</qualite></orateur>
            </orateurs>
            <texte>C’était une invitation !</texte>
          </paragraphe>
        </interExtraction>
        <paragraphe ordre_absolu_seance="23" code_grammaire="INTERRUPTION_1_10" code_style="NORMAL" id_syceron="3509003">
          <orateurs><orateur><nom>Plusieurs députés du groupe RN</nom><id/><qualite/></orateur></orateurs>
          <texte>Encore ?</texte>
        </paragraphe>
      </point>
    </point>
    <finSeance ordre_absolu_seance="99" id_syceron="3509300">
      <paragraphe ordre_absolu_seance="100" code_grammaire="FIN_SEAN_2_5" code_style="Info Italiques" id_syceron="3509301">
        <orateurs/>
        <texte><italique>(La séance est levée à dix-neuf heures.)</italique></texte>
      </paragraphe>
    </finSeance>
  </contenu>
</compteRendu>`;

describe('texteBrut', () => {
    it('retire les balises, garde les sauts de ligne et décode les entités', () => {
        expect(texteBrut('A<exposant>er </exposant>b &amp; c &#8217;<br/> d <italique>(e)</italique>')).toBe('Aer b & c ’\nd (e)');
    });

    it('lit le contenu d\'un texte porteur d\'attributs (stime)', () => {
        expect(texteBrut({ '#text': 'Bonjour', '@stime': '1.5' })).toBe('Bonjour');
    });

    it('renvoie null pour un texte vide ou absent', () => {
        expect(texteBrut(undefined)).toBeNull();
        expect(texteBrut('  <italique> </italique> ')).toBeNull();
    });
});

describe('DebatsExtractor', () => {
    let cleanups: Array<() => void> = [];

    afterEach(() => {
        cleanups.forEach((c) => c());
        cleanups = [];
    });

    async function extract(...xmls: string[]) {
        const extractor = new DebatsExtractor(17);
        for (const xml of xmls) {
            const { filePath, cleanup } = writeTempJsonFile(xml, { raw: true });
            cleanups.push(cleanup);
            await extractor.processFile(filePath);
        }
        return extractor;
    }

    it('extrait le compte rendu et le rattache à sa séance', async () => {
        const extractor = await extract(COMPTE_RENDU);

        expect(extractor.getTables().debatsComptesRendus).toEqual([{
            uid: 'CRSANR5L17S2024D1N001',
            seance_uid: 'RUANR5L17S2024IDS28537',
            session_ref: 'SCR5A2024D1',
            date_seance: '2024-07-18T15:00:00',
            date_seance_libelle: 'jeudi 18 juillet 2024',
            num_seance: 1,
            quantieme: 'Unique',
            legislature: 17,
            session_libelle: 'Session de droit juillet 2024',
            num_jo: '20245001',
            etat: 'complet',
            validite: 'valide',
            version: 'avant_JO',
            legislature_snapshot: 17,
            row_hash: expect.stringMatching(ROW_HASH_PATTERN),
        }]);
    });

    it('extrait l\'arbre des points (parent, profondeur, titre sans balises)', async () => {
        const extractor = await extract(COMPTE_RENDU);

        expect(extractor.getTables().debatsPoints.map((p) => [p.id, p.parent_id, p.profondeur, p.ordre, p.titre])).toEqual([
            ['3508745', null, 1, 11, 'Ouverture de la XVIIe législature'],
            ['3509000', '3508745', 2, 20, 'Article 1er'],
        ]);
    });

    it('extrait chaque paragraphe avec son point englobant, y compris dans interExtraction et hors point', async () => {
        const extractor = await extract(COMPTE_RENDU);
        // L'ordre de sortie suit le regroupement par balise du parseur : l'ordre réel est `ordre`.
        const interventions = [...extractor.getTables().debatsInterventions].sort((a, b) => a.ordre - b.ordre);

        expect(interventions.map((i) => [i.id, i.point_id, i.ordre, i.acteur_uid, i.role_debat, i.code_grammaire])).toEqual([
            ['3508736', null, 2, 'PA793362', 'president', 'OUV_SEAN_2_1'],
            ['3508746', '3508745', 12, 'PA793362', 'president', 'ODJ_APPEL_DISCUSSION'],
            ['3509001', '3509000', 21, 'PA795746', null, 'DISC_ARTICLES_3_4_1'],
            ['3509002', '3509000', 22, null, null, 'INTERRUPTION_1_10'],
            ['3509003', '3509000', 23, null, null, 'INTERRUPTION_1_10'],
            ['3509301', null, 100, null, null, 'FIN_SEAN_2_5'],
        ]);
    });

    it('garde le texte sans balises, l\'horodatage vidéo et les références d\'amendement', async () => {
        const extractor = await extract(COMPTE_RENDU);
        const [, appel, amendement] = extractor.getTables().debatsInterventions;

        expect(appel).toMatchObject({
            texte: 'Aux termes de l’article 1er du règlement, les six plus jeunes députés & secrétaires…\nLe bureau d’âge est ainsi constitué. (Applaudissements.)',
            stime: 1159.97,
            orateurs_libelle: 'M. le président',
            bibard: null,
            amendement: null,
        });
        expect(amendement).toMatchObject({
            stime: 2000.5,
            type_debat: 'ADT',
            bibard: '1640',
            article: '1er',
            amendement: '13',
            sous_amendement: null,
            decision: 'Rejeté',
            row_hash: expect.stringMatching(ROW_HASH_PATTERN),
        });
    });

    it('extrait chaque orateur ; null pour un orateur collectif ou sans fiche acteur (identifiant négatif)', async () => {
        const extractor = await extract(COMPTE_RENDU);
        const orateurs = extractor.getTables().debatsInterventionsOrateurs;

        expect(orateurs.filter((o) => ['3509002', '3509003'].includes(o.intervention_id))
            .sort((a, b) => a.intervention_id.localeCompare(b.intervention_id) || a.ordre - b.ordre)
            .map((o) => [o.intervention_id, o.ordre, o.acteur_uid, o.nom, o.qualite])).toEqual([
            ['3509002', 0, 'PA719558', 'M. Erwan Balanant', null],
            ['3509002', 1, null, 'M. François Bayrou', 'premier ministre'],
            ['3509003', 0, null, 'Plusieurs députés du groupe RN', null],
        ]);
        expect(extractor.getTables().debatsInterventions.find((i) => i.id === '3509002')?.orateurs_libelle)
            .toBe('M. Erwan Balanant, M. François Bayrou');
    });

    it('consigne une erreur pour un fichier sans uid de compte rendu, sans s\'interrompre', async () => {
        const extractor = await extract('<compteRendu><metadonnees/></compteRendu>', COMPTE_RENDU);

        expect(extractor.getTables().debatsComptesRendus).toHaveLength(1);
        expect(extractor.getErrors()).toEqual([expect.objectContaining({ error: 'Missing compteRendu uid' })]);
    });

    it('clearTables vide toutes les tables', async () => {
        const extractor = await extract(COMPTE_RENDU);
        extractor.clearTables();

        expect(Object.values(extractor.getTables()).every((t) => t.length === 0)).toBe(true);
    });
});
