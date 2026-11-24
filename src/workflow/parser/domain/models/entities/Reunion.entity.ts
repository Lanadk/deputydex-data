/**
 * Une réunion de l'agenda de l'Assemblée nationale (jeu « Réunions »,
 * fichiers `reunions/json/reunion/*.json`) : réunion de commission, séance
 * publique ou réunion à l'initiative d'un parlementaire (groupe d'études…).
 */
export interface Reunion {
    uid: string;
    /** commission | seance | init_parlementaire (dérivé de `@xsi:type`). */
    type_reunion: string;
    /** Législature portée par l'uid (RUANR5L17…), null si illisible. */
    legislature: number | null;
    organe_uid: string;
    /** Confirmé, Annulé, Eventuel, Supprimé. */
    etat: string | null;
    date_debut: string;
    date_fin: string | null;
    session_ref: string | null;
    compte_rendu_ref: string | null;
    lieu_ref: string | null;
    lieu_libelle: string | null;
    /** Ordinaire (commissions uniquement). */
    format_reunion: string | null;
    /** Sous-type des réunions à l'initiative d'un parlementaire (GE = groupe d'études). */
    sous_type_reunion: string | null;
    visio_conference: boolean | null;
    captation_video: boolean | null;
    ouverture_presse: boolean | null;
    est_reunion_internationale: boolean | null;
    /** Séances publiques uniquement. */
    date_seance: string | null;
    id_jo: string | null;
    num_seance_jo: number | null;
    /** Unique, Première, Deuxième… (séances publiques). */
    quantieme: string | null;
    /** Items de `resumeODJ`, joints par un saut de ligne. */
    resume_odj: string | null;
    /** Items de `convocationODJ`, joints par un saut de ligne. */
    convocation_odj: string | null;
    legislature_snapshot: number;
    row_hash: string;
}

/** Statut d'un député convoqué à une réunion (liste des participants internes). */
export interface ReunionParticipant {
    reunion_uid: string;
    acteur_uid: string;
    /** présent | absent | excusé */
    presence: string;
    legislature_snapshot: number;
    row_hash: string;
}

/** Point de l'ordre du jour d'une réunion. */
export interface ReunionPointOdj {
    uid: string;
    reunion_uid: string;
    /** Ordre du point dans la réunion (0-based). */
    ordre: number;
    type_point: string | null;
    objet: string | null;
    etat: string | null;
    procedure: string | null;
    nature_travaux: string | null;
    comite_secret: boolean | null;
    date_conf_pres: string | null;
    legislature_snapshot: number;
    row_hash: string;
}

/** Dossier législatif rattaché à un point de l'ordre du jour. */
export interface ReunionPointOdjDossier {
    point_uid: string;
    reunion_uid: string;
    dossier_uid: string;
    legislature_snapshot: number;
    row_hash: string;
}
