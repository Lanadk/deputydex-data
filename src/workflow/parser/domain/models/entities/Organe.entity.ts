/**
 * Un organe de l'Assemblée nationale (commission, groupe, ministère,
 * gouvernement, délégation…), tel que décrit dans les fichiers
 * `acteurs/json/organe/*.json` du jeu AMO.
 */
export interface Organe {
    uid: string;
    /** Type d'organe : COMPER, GP, MINISTERE, GOUVERNEMENT, PRESREP… */
    code_type: string;
    libelle: string | null;
    /** Forme à insérer dans une phrase : « de la commission des finances ». */
    libelle_edition: string | null;
    /** Forme courte : « Finances », « Intérieur ». */
    libelle_abrege: string | null;
    /** Sigle : « CION_FIN », « INT ». */
    libelle_abrev: string | null;
    date_debut: string | null;
    date_fin: string | null;
    /** Organe parent (ex. le gouvernement d'un ministère). */
    organe_parent_uid: string | null;
    /** Organe qui précède celui-ci (ex. le même ministère dans le gouvernement précédent). */
    organe_precedent_uid: string | null;
    /** Rang protocolaire (ministères), null si absent. */
    preseance: number | null;
    /** Législature de l'organe, null pour un organe permanent. */
    legislature: number | null;
    legislature_snapshot: number;
    row_hash: string;
}
