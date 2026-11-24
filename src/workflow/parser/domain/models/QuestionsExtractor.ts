import * as fs from 'fs';
import * as path from 'path';
import {Question, QuestionMinistereAttributaire} from './entities/Question.entity';
import {IExtractor} from "../../infrastructure/IExtractor";
import {computeRowHash} from "../../../../utils/hash";
import {extractNilableValue, toDateOrNull, toIntOrNull} from "../../infrastructure/impl/xml-nil.utils";
import {asArray} from "../../infrastructure/impl/utils";

const TYPES_QUESTION = new Set(['QG', 'QOSD', 'QE']);

/**
 * Premier texte non vide d'une liste `texteQuestion` / `texteReponse`, avec la
 * date et la page JO de cette publication. Une liste de plusieurs entrées
 * signale un erratum : la première est la publication d'origine.
 */
function premierTexte(liste: any): { texte: string | null; dateJO: string | null; pageJO: string | null; typeJO: string | null } {
    const entrees = asArray(liste);
    const avecTexte = entrees.find((e) => extractNilableValue(e?.texte)) ?? entrees[0];
    return {
        texte: extractNilableValue(avecTexte?.texte),
        dateJO: toDateOrNull(avecTexte?.infoJO?.dateJO),
        pageJO: extractNilableValue(avecTexte?.infoJO?.pageJO),
        typeJO: extractNilableValue(avecTexte?.infoJO?.typeJO),
    };
}

/**
 * Extrait les questions parlementaires (un fichier par question). Les trois
 * jeux — au Gouvernement (QG), orales sans débat (QOSD), écrites (QE) —
 * partagent le même format ; le type est porté par `question.type`.
 */
export class QuestionsExtractor implements IExtractor {
    private questions: Question[] = [];
    private ministeresAttributaires: QuestionMinistereAttributaire[] = [];
    private errors: Array<{ file: string; error: string }> = [];

    constructor(private readonly legislatureSnapshot: number) {
    }

    async processFile(filePath: string): Promise<void> {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            this.extractData(JSON.parse(content));
        } catch (error) {
            this.errors.push({
                file: path.basename(filePath),
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    getTables(): Record<string, any[]> {
        return {
            questions: this.questions,
            questionsMinisteresAttributaires: this.ministeresAttributaires,
        };
    }

    getErrors(): Array<{ file: string; error: string }> {
        return this.errors;
    }

    clearTables(): void {
        this.questions = [];
        this.ministeresAttributaires = [];
    }

    private extractData(data: any): void {
        const q = data.question || data;
        const uid = extractNilableValue(q.uid);
        if (!uid) throw new Error('Missing uid');
        const type = extractNilableValue(q.type);
        if (!type || !TYPES_QUESTION.has(type)) throw new Error(`Unknown question type ${type} for ${uid}`);
        const acteurUid = extractNilableValue(q.auteur?.identite?.acteurRef);
        if (!acteurUid) throw new Error(`Missing auteur for ${uid}`);

        const question = premierTexte(q.textesQuestion?.texteQuestion);
        const reponse = premierTexte(q.textesReponse?.texteReponse);
        const renouvellements = asArray(q.renouvellements?.renouvellement)
            .map((r) => toDateOrNull(r?.infoJO?.dateJO))
            .filter((d): d is string => !!d)
            .sort();

        const questionObj = {
            uid,
            type_question: type,
            legislature: toIntOrNull(q.identifiant?.legislature),
            numero: toIntOrNull(q.identifiant?.numero),
            acteur_uid: acteurUid,
            mandat_uid: extractNilableValue(q.auteur?.identite?.mandatRef),
            groupe_uid: extractNilableValue(q.auteur?.groupe?.organeRef),
            groupe_abrege: extractNilableValue(q.auteur?.groupe?.abrege),
            rubrique: extractNilableValue(q.indexationAN?.rubrique),
            tete_analyse: extractNilableValue(q.indexationAN?.teteAnalyse),
            libelle_analyse: extractNilableValue(q.indexationAN?.analyses?.analyse),
            ministere_uid: extractNilableValue(q.minInt?.organeRef),
            ministere_abrege: extractNilableValue(q.minInt?.abrege),
            date_question: question.dateJO,
            texte_question: question.texte,
            date_reponse: reponse.dateJO,
            type_jo_reponse: reponse.typeJO,
            page_jo_reponse: reponse.pageJO,
            texte_reponse: reponse.texte,
            code_cloture: extractNilableValue(q.cloture?.codeCloture),
            libelle_cloture: extractNilableValue(q.cloture?.libelleCloture),
            date_cloture: toDateOrNull(q.cloture?.dateCloture),
            nb_renouvellements: renouvellements.length,
            date_dernier_renouvellement: renouvellements.length ? renouvellements[renouvellements.length - 1] : null,
            date_signalement: toDateOrNull(q.signalement?.dateDepotSignal),
            legislature_snapshot: this.legislatureSnapshot,
        };
        this.questions.push({...questionObj, row_hash: computeRowHash(questionObj)});

        asArray(q.minAttribs?.minAttrib).forEach((m, ordre) => {
            const obj = {
                question_uid: uid,
                ordre,
                ministere_uid: extractNilableValue(m?.denomination?.organeRef),
                ministere_abrege: extractNilableValue(m?.denomination?.abrege),
                date_jo: toDateOrNull(m?.infoJO?.dateJO),
                legislature_snapshot: this.legislatureSnapshot,
            };
            this.ministeresAttributaires.push({...obj, row_hash: computeRowHash(obj)});
        });
    }
}
