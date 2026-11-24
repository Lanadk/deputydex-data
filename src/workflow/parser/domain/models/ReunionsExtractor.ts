import * as fs from 'fs';
import * as path from 'path';
import {
    Reunion,
    ReunionParticipant,
    ReunionPointOdj,
    ReunionPointOdjDossier,
} from './entities/Reunion.entity';
import {IExtractor} from "../../infrastructure/IExtractor";
import {computeRowHash} from "../../../../utils/hash";
import {extractNilableValue, toBoolOrNull, toDateOrNull, toIntOrNull} from "../../infrastructure/impl/xml-nil.utils";
import {asArray} from "../../infrastructure/impl/utils";

const TYPES_REUNION: Record<string, string> = {
    reunionCommission_type: 'commission',
    seance_type: 'seance',
    reunionInitParlementaire_type: 'init_parlementaire',
};

/**
 * La liste de présence de l'open data est dérivée du compte rendu de la
 * réunion : « Présents » → présent, « Excusés » → excusé, « Assistaient
 * également à la réunion » (députés présents hors membres) → présent, et tout
 * membre de l'organe cité nulle part → absent. Un député à la fois rattaché à
 * l'organe et noté sous « Assistaient également » (fréquent avec les
 * remplacements temporaires en commission) sort donc deux fois : absent ET
 * présent. Vérifié sur les comptes rendus publiés (ex. CION_FIN du 30/10/2024,
 * n° 35 ; CION_DEF du 20/11/2024, n° 24) : le député y est bien présent et
 * intervient. On garde donc le statut le plus « fort » (présent > excusé > absent).
 */
const RANG_PRESENCE: Record<string, number> = {'présent': 3, 'excusé': 2, 'absent': 1};

/**
 * Items texte (`resumeODJ.item`, `convocationODJ.item`) joints par un saut de
 * ligne. Les sources séparent parfois les lignes d'un même item par un `\r` seul.
 */
function joinItems(bloc: any): string | null {
    const items = asArray(bloc?.item)
        .map((i) => extractNilableValue(i)?.replace(/\r\n?/g, '\n').trim())
        .filter((i): i is string => !!i);
    return items.length ? items.join('\n') : null;
}

/** RUANR5L17S2024IDC453266 → 17 */
function legislatureFromUid(uid: string): number | null {
    const m = /R5L(\d+)/.exec(uid);
    return m ? Number.parseInt(m[1], 10) : null;
}

/**
 * Extrait les réunions de l'agenda (jeu « Réunions », un fichier par réunion) :
 * la réunion elle-même, la liste de présence des députés convoqués (réunions
 * de commission uniquement : les séances publiques n'en ont pas), les points
 * de l'ordre du jour et les dossiers législatifs qu'ils traitent.
 */
export class ReunionsExtractor implements IExtractor {
    private reunions: Reunion[] = [];
    private participants: ReunionParticipant[] = [];
    private pointsOdj: ReunionPointOdj[] = [];
    private pointsOdjDossiers: ReunionPointOdjDossier[] = [];
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
            reunions: this.reunions,
            reunionsParticipants: this.participants,
            reunionsPointsOdj: this.pointsOdj,
            reunionsPointsOdjDossiers: this.pointsOdjDossiers,
        };
    }

    getErrors(): Array<{ file: string; error: string }> {
        return this.errors;
    }

    clearTables(): void {
        this.reunions = [];
        this.participants = [];
        this.pointsOdj = [];
        this.pointsOdjDossiers = [];
    }

    private extractData(data: any): void {
        const r = data.reunion || data;
        const uid = extractNilableValue(r.uid);
        if (!uid) throw new Error('Missing uid');
        const xsiType = r['@xsi:type'];
        const typeReunion = TYPES_REUNION[xsiType];
        if (!typeReunion) throw new Error(`Unknown reunion type ${xsiType} for ${uid}`);
        const organeUid = extractNilableValue(r.organeReuniRef);
        if (!organeUid) throw new Error(`Missing organeReuniRef for ${uid}`);
        const dateDebut = extractNilableValue(r.timeStampDebut);
        if (!dateDebut) throw new Error(`Missing timeStampDebut for ${uid}`);

        const reunionObj = {
            uid,
            type_reunion: typeReunion,
            legislature: legislatureFromUid(uid),
            organe_uid: organeUid,
            etat: extractNilableValue(r.cycleDeVie?.etat),
            date_debut: dateDebut,
            date_fin: extractNilableValue(r.timeStampFin),
            session_ref: extractNilableValue(r.sessionRef),
            compte_rendu_ref: extractNilableValue(r.compteRenduRef),
            lieu_ref: extractNilableValue(r.lieu?.lieuRef),
            lieu_libelle: extractNilableValue(r.lieu?.libelleLong),
            format_reunion: extractNilableValue(r.formatReunion),
            sous_type_reunion: extractNilableValue(r.typeReunion),
            visio_conference: toBoolOrNull(r.visioConference),
            captation_video: toBoolOrNull(r.captationVideo),
            ouverture_presse: toBoolOrNull(r.ouverturePresse),
            est_reunion_internationale: toBoolOrNull(r.infosReunionsInternationale?.estReunionInternationale),
            date_seance: toDateOrNull(r.identifiants?.DateSeance),
            id_jo: extractNilableValue(r.identifiants?.idJO),
            num_seance_jo: toIntOrNull(r.identifiants?.numSeanceJO),
            quantieme: extractNilableValue(r.identifiants?.quantieme),
            resume_odj: joinItems(r.ODJ?.resumeODJ),
            convocation_odj: joinItems(r.ODJ?.convocationODJ),
            legislature_snapshot: this.legislatureSnapshot,
        };
        this.reunions.push({...reunionObj, row_hash: computeRowHash(reunionObj)});

        this.extractParticipants(uid, r.participants?.participantsInternes?.participantInterne);
        this.extractPointsOdj(uid, r.ODJ?.pointsODJ?.pointODJ);
    }

    private extractParticipants(reunionUid: string, liste: any): void {
        const parActeur = new Map<string, string>();
        for (const p of asArray(liste)) {
            const acteurUid = extractNilableValue(p?.acteurRef);
            const presence = extractNilableValue(p?.presence);
            if (!acteurUid || !presence) continue;
            const actuel = parActeur.get(acteurUid);
            if (!actuel || (RANG_PRESENCE[presence] ?? 0) > (RANG_PRESENCE[actuel] ?? 0)) {
                parActeur.set(acteurUid, presence);
            }
        }
        for (const [acteurUid, presence] of parActeur) {
            const obj = {
                reunion_uid: reunionUid,
                acteur_uid: acteurUid,
                presence,
                legislature_snapshot: this.legislatureSnapshot,
            };
            this.participants.push({...obj, row_hash: computeRowHash(obj)});
        }
    }

    private extractPointsOdj(reunionUid: string, points: any): void {
        asArray(points).forEach((pt, ordre) => {
            const pointUid = extractNilableValue(pt?.uid);
            if (!pointUid) return;
            const obj = {
                uid: pointUid,
                reunion_uid: reunionUid,
                ordre,
                type_point: extractNilableValue(pt.typePointODJ),
                objet: extractNilableValue(pt.objet),
                etat: extractNilableValue(pt.cycleDeVie?.etat),
                procedure: extractNilableValue(pt.procedure),
                nature_travaux: extractNilableValue(pt.natureTravauxODJ),
                comite_secret: toBoolOrNull(pt.comiteSecret),
                date_conf_pres: toDateOrNull(pt.dateConfPres),
                legislature_snapshot: this.legislatureSnapshot,
            };
            this.pointsOdj.push({...obj, row_hash: computeRowHash(obj)});

            const dossiers = new Set(
                asArray(pt.dossiersLegislatifsRefs?.dossierRef)
                    .map((d) => extractNilableValue(d))
                    .filter((d): d is string => !!d)
            );
            for (const dossierUid of dossiers) {
                const lien = {
                    point_uid: pointUid,
                    reunion_uid: reunionUid,
                    dossier_uid: dossierUid,
                    legislature_snapshot: this.legislatureSnapshot,
                };
                this.pointsOdjDossiers.push({...lien, row_hash: computeRowHash(lien)});
            }
        });
    }
}
