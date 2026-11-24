/**
 * Une question parlementaire (jeux « Questions au Gouvernement », « Questions
 * orales sans débat » et « Questions écrites », même format pour les trois).
 */
export interface Question {
    uid: string;
    /** QG (au Gouvernement), QOSD (orale sans débat), QE (écrite). */
    type_question: string;
    legislature: number | null;
    numero: number | null;
    acteur_uid: string;
    mandat_uid: string | null;
    /** Groupe de l'auteur au moment de la question. */
    groupe_uid: string | null;
    groupe_abrege: string | null;
    rubrique: string | null;
    tete_analyse: string | null;
    /** Analyse AN = intitulé court de la question (`analyse` est un mot réservé PostgreSQL). */
    libelle_analyse: string | null;
    /** Ministère interrogé. */
    ministere_uid: string | null;
    ministere_abrege: string | null;
    /** Publication de la question au JO (QOSD, QE ; null pour les QG, posées directement en séance). */
    date_question: string | null;
    texte_question: string | null;
    /** Réponse : date du JO (= date de la séance pour QG et QOSD, publiées au JO des débats). */
    date_reponse: string | null;
    /** JO_DEBAT (réponse en séance) ou JO_QUESTION (réponse écrite). */
    type_jo_reponse: string | null;
    page_jo_reponse: string | null;
    texte_reponse: string | null;
    /** REP_PUB, AU (retrait auteur), FM (fin de mandat), ANSE (séance annulée)… */
    code_cloture: string | null;
    libelle_cloture: string | null;
    date_cloture: string | null;
    /** Questions écrites : renouvellements (relances faute de réponse) et signalement. */
    nb_renouvellements: number;
    date_dernier_renouvellement: string | null;
    date_signalement: string | null;
    legislature_snapshot: number;
    row_hash: string;
}

/** Ministère attributaire d'une question (une question peut être réattribuée). */
export interface QuestionMinistereAttributaire {
    question_uid: string;
    /** Rang de l'attribution (0 = première). */
    ordre: number;
    ministere_uid: string | null;
    ministere_abrege: string | null;
    date_jo: string | null;
    legislature_snapshot: number;
    row_hash: string;
}
