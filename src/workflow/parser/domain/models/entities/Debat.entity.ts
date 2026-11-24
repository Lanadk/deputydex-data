/**
 * Compte rendu intégral d'une séance publique (jeu « Débats », format Syceron,
 * un fichier XML par séance).
 */
export interface DebatCompteRendu {
    uid: string;
    /** Séance de l'agenda (`reunions.uid`, type_reunion = 'seance'). */
    seance_uid: string | null;
    session_ref: string | null;
    /** Date et heure d'ouverture, heure de Paris sans fuseau (« 2024-07-18T15:00:00 »). */
    date_seance: string | null;
    /** « jeudi 18 juillet 2024 » */
    date_seance_libelle: string | null;
    num_seance: number | null;
    /** Unique, Première, Deuxième… */
    quantieme: string | null;
    legislature: number | null;
    session_libelle: string | null;
    num_jo: string | null;
    /** complet… */
    etat: string | null;
    /** valide… */
    validite: string | null;
    /** avant_JO… */
    version: string | null;
    legislature_snapshot: number;
    row_hash: string;
}

/** Point de l'ordre du jour d'une séance (les points s'imbriquent). */
export interface DebatPoint {
    /** `id_syceron` du point. */
    id: string;
    compte_rendu_uid: string;
    parent_id: string | null;
    /** Profondeur dans l'arbre des points (1 = point de premier niveau). */
    profondeur: number;
    ordre: number | null;
    valeur_pts_odj: string | null;
    code_grammaire: string | null;
    titre: string | null;
    legislature_snapshot: number;
    row_hash: string;
}

/** Paragraphe du compte rendu : prise de parole, interruption, annonce de la présidence… */
export interface DebatIntervention {
    /** `id_syceron` du paragraphe. */
    id: string;
    compte_rendu_uid: string;
    /** Point englobant le plus proche ; null hors point (ouverture, fin de séance). */
    point_id: string | null;
    ordre: number | null;
    /** Orateur principal (`id_acteur`) ; null si absent, « PA0 » (plusieurs orateurs) ou négatif (sans fiche acteur AN). */
    acteur_uid: string | null;
    mandat_uid: string | null;
    /** president si l'orateur préside la séance, sinon null. */
    role_debat: string | null;
    /** Nature du paragraphe : PAROLE_GENERIQUE, INTERRUPTION_1_10, DISC_ARTICLES_…, SCRUT_PUB_… */
    code_grammaire: string | null;
    code_style: string | null;
    type_debat: string | null;
    /** Libellé des orateurs tel qu'imprimé (« M. le président », « Plusieurs députés du groupe RN »). */
    orateurs_libelle: string | null;
    /** Texte sans balises (sauts de ligne conservés). */
    texte: string | null;
    /** Position dans la vidéo de la séance, en secondes. */
    stime: number | null;
    /** Discussion d'amendement : numéro de texte (bibard), article, amendement, sous-amendement. */
    bibard: string | null;
    article: string | null;
    amendement: string | null;
    sous_amendement: string | null;
    amendement_uid: string | null;
    decision: string | null;
    legislature_snapshot: number;
    row_hash: string;
}

/** Orateur d'un paragraphe (un paragraphe peut en compter plusieurs, ex. interruption commune). */
export interface DebatInterventionOrateur {
    intervention_id: string;
    ordre: number;
    /**
     * « PA » + identifiant de l'orateur ; null pour un orateur collectif (« Plusieurs
     * députés… ») ou sans fiche acteur AN (identifiant négatif : personnalité auditionnée…).
     */
    acteur_uid: string | null;
    nom: string | null;
    qualite: string | null;
    legislature_snapshot: number;
    row_hash: string;
}
