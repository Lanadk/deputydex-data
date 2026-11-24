import * as fs from 'fs';
import * as path from 'path';
import {XMLParser} from 'fast-xml-parser';
import {
    DebatCompteRendu,
    DebatIntervention,
    DebatInterventionOrateur,
    DebatPoint,
} from './entities/Debat.entity';
import {IExtractor} from "../../infrastructure/IExtractor";
import {computeRowHash} from "../../../../utils/hash";

/**
 * `<texte>` mêle texte et balises de mise en forme (`<italique>`, `<exposant>`,
 * `<br/>`) : il est lu brut (stopNodes) puis aplati par `texteBrut`.
 */
const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@',
    stopNodes: ['*.texte'],
    parseTagValue: false,
    parseAttributeValue: false,
});

/** Éléments qui ne contiennent ni point ni paragraphe à extraire. */
const FEUILLES = new Set(['texte', 'orateurs', '#text']);

const ENTITES: Record<string, string> = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' '};

function decoderEntites(s: string): string {
    return s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (entite, code: string) => {
        if (code[0] === '#') {
            const n = code[1].toLowerCase() === 'x' ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10);
            return Number.isNaN(n) ? entite : String.fromCodePoint(n);
        }
        return ENTITES[code.toLowerCase()] ?? entite;
    });
}

/** Contenu brut d'un `<texte>` (chaîne, ou objet quand il porte un attribut `stime`). */
function contenuBrut(texte: any): string | null {
    if (texte == null) return null;
    if (typeof texte === 'string') return texte;
    return typeof texte['#text'] === 'string' ? texte['#text'] : null;
}

/** Texte sans balises : `<br/>` → saut de ligne, entités décodées, espaces normalisés. */
export function texteBrut(texte: any): string | null {
    const brut = contenuBrut(texte);
    if (brut == null) return null;
    const lignes = decoderEntites(brut.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, ''))
        .split('\n')
        .map((l) => l.replace(/\s+/g, ' ').trim())
        .filter((l) => l.length > 0);
    return lignes.length ? lignes.join('\n') : null;
}

/** « 20240718150000000 » → « 2024-07-18T15:00:00 » (heure de Paris, sans fuseau). */
function dateSeance(val: any): string | null {
    const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/.exec(String(val ?? ''));
    return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}` : null;
}

function texteOuNull(val: any): string | null {
    if (val == null || typeof val === 'object') return null;
    const s = String(val).trim();
    return s.length ? s : null;
}

function entierOuNull(val: any): number | null {
    const n = Number.parseInt(String(val ?? ''), 10);
    return Number.isNaN(n) ? null : n;
}

function decimalOuNull(val: any): number | null {
    const n = Number.parseFloat(String(val ?? ''));
    return Number.isNaN(n) ? null : n;
}

/**
 * Identifiant d'acteur AN, ou null. « PA0 » signale plusieurs orateurs sans
 * orateur principal ; un identifiant négatif (« PA-125869 ») désigne une
 * personne sans fiche acteur à l'Assemblée (personnalité auditionnée, ministre
 * non député…).
 */
function acteurOuNull(val: any): string | null {
    const s = texteOuNull(val);
    return s && /^PA[1-9]\d*$/.test(s) ? s : null;
}

function enfants(val: any): any[] {
    if (val == null) return [];
    return (Array.isArray(val) ? val : [val]).filter((c) => c && typeof c === 'object');
}

/**
 * Extrait les comptes rendus de séance (jeu « Débats », XML Syceron) : le
 * compte rendu, l'arbre des points de l'ordre du jour, chaque paragraphe
 * (intervention, interruption, annonce de la présidence…) et ses orateurs.
 */
export class DebatsExtractor implements IExtractor {
    private comptesRendus: DebatCompteRendu[] = [];
    private points: DebatPoint[] = [];
    private interventions: DebatIntervention[] = [];
    private orateurs: DebatInterventionOrateur[] = [];
    private errors: Array<{ file: string; error: string }> = [];

    constructor(private readonly legislatureSnapshot: number) {
    }

    async processFile(filePath: string): Promise<void> {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            this.extractData(xmlParser.parse(content));
        } catch (error) {
            this.errors.push({
                file: path.basename(filePath),
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    getTables(): Record<string, any[]> {
        return {
            debatsComptesRendus: this.comptesRendus,
            debatsPoints: this.points,
            debatsInterventions: this.interventions,
            debatsInterventionsOrateurs: this.orateurs,
        };
    }

    getErrors(): Array<{ file: string; error: string }> {
        return this.errors;
    }

    clearTables(): void {
        this.comptesRendus = [];
        this.points = [];
        this.interventions = [];
        this.orateurs = [];
    }

    private extractData(data: any): void {
        const cr = data?.compteRendu;
        const uid = texteOuNull(cr?.uid);
        if (!uid) throw new Error('Missing compteRendu uid');
        const meta = cr.metadonnees ?? {};

        const crObj = {
            uid,
            seance_uid: texteOuNull(cr.seanceRef),
            session_ref: texteOuNull(cr.sessionRef),
            date_seance: dateSeance(meta.dateSeance),
            date_seance_libelle: texteOuNull(meta.dateSeanceJour),
            num_seance: entierOuNull(meta.numSeance),
            quantieme: texteOuNull(meta.numSeanceJour),
            legislature: entierOuNull(meta.legislature),
            session_libelle: texteOuNull(meta.session),
            num_jo: texteOuNull(meta.nomFichierJo),
            etat: texteOuNull(meta.etat),
            validite: texteOuNull(meta.validite),
            version: texteOuNull(meta.version),
            legislature_snapshot: this.legislatureSnapshot,
        };
        this.comptesRendus.push({...crObj, row_hash: computeRowHash(crObj)});

        if (cr.contenu && typeof cr.contenu === 'object') this.parcourir(uid, cr.contenu, null, 0);
    }

    /**
     * Parcourt l'arbre du contenu. Les `point` forment la hiérarchie ; les autres
     * conteneurs (ouverture/fin de séance, interExtraction, changementPresidence…)
     * sont traversés sans changer de point englobant. Le parseur regroupe les
     * enfants par balise : l'ordre de sortie n'est pas celui du document, c'est
     * `ordre` (ordre_absolu_seance) qui le porte.
     */
    private parcourir(crUid: string, noeud: any, pointId: string | null, profondeur: number): void {
        for (const [cle, valeur] of Object.entries(noeud)) {
            if (cle.startsWith('@') || FEUILLES.has(cle)) continue;
            for (const enfant of enfants(valeur)) {
                if (cle === 'paragraphe') {
                    this.ajouterIntervention(crUid, enfant, pointId);
                } else if (cle === 'point') {
                    const id = texteOuNull(enfant['@id_syceron']);
                    if (id) this.ajouterPoint(crUid, enfant, id, pointId, profondeur + 1);
                    this.parcourir(crUid, enfant, id ?? pointId, profondeur + 1);
                } else {
                    this.parcourir(crUid, enfant, pointId, profondeur);
                }
            }
        }
    }

    private ajouterPoint(crUid: string, p: any, id: string, parentId: string | null, profondeur: number): void {
        const obj = {
            id,
            compte_rendu_uid: crUid,
            parent_id: parentId,
            profondeur,
            ordre: entierOuNull(p['@ordre_absolu_seance']),
            valeur_pts_odj: texteOuNull(p['@valeur_ptsodj']),
            code_grammaire: texteOuNull(p['@code_grammaire']),
            titre: texteBrut(p.texte),
            legislature_snapshot: this.legislatureSnapshot,
        };
        this.points.push({...obj, row_hash: computeRowHash(obj)});
    }

    private ajouterIntervention(crUid: string, p: any, pointId: string | null): void {
        const id = texteOuNull(p['@id_syceron']);
        if (!id) return;
        const orateurs = enfants(p.orateurs?.orateur);

        const obj = {
            id,
            compte_rendu_uid: crUid,
            point_id: pointId,
            ordre: entierOuNull(p['@ordre_absolu_seance']),
            acteur_uid: acteurOuNull(p['@id_acteur']),
            mandat_uid: texteOuNull(p['@id_mandat']),
            role_debat: texteOuNull(p['@roledebat']),
            code_grammaire: texteOuNull(p['@code_grammaire']),
            code_style: texteOuNull(p['@code_style']),
            type_debat: texteOuNull(p['@type_debat']),
            orateurs_libelle: orateurs.map((o) => texteOuNull(o.nom)).filter((n): n is string => !!n).join(', ') || null,
            texte: texteBrut(p.texte),
            stime: decimalOuNull(p.texte?.['@stime']),
            bibard: texteOuNull(p['@bibard']),
            article: texteOuNull(p['@art']),
            amendement: texteOuNull(p['@adt']),
            sous_amendement: texteOuNull(p['@ssadt']),
            amendement_uid: texteOuNull(p['@uid_adt']),
            decision: texteOuNull(p['@decision']),
            legislature_snapshot: this.legislatureSnapshot,
        };
        this.interventions.push({...obj, row_hash: computeRowHash(obj)});

        orateurs.forEach((o, ordre) => {
            const idOrateur = texteOuNull(o.id);
            const orateurObj = {
                intervention_id: id,
                ordre,
                acteur_uid: idOrateur ? acteurOuNull(`PA${idOrateur}`) : null,
                nom: texteOuNull(o.nom),
                qualite: texteOuNull(o.qualite),
                legislature_snapshot: this.legislatureSnapshot,
            };
            this.orateurs.push({...orateurObj, row_hash: computeRowHash(orateurObj)});
        });
    }
}
