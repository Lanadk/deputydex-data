export interface Acteur {
    uid: string;
    civilite: string | null;
    prenom: string | null;
    nom: string | null;
    nom_alpha: string | null;
    trigramme: string | null;
    date_naissance: string | null;
    ville_naissance: string | null;
    departement_naissance: string | null;
    pays_naissance: string | null;
    date_deces: string | null;
    profession_libelle: string | null;
    profession_categorie: string | null;
    profession_famille: string | null;
    uri_hatvp: string | null;
    row_hash: string;
    legislature_snapshot: number;
}

export interface ActeurAdressePostale {
    acteur_uid: string;
    uid_adresse: string;
    type_code: string | null;
    type_libelle: string | null;
    intitule: string | null;
    numero_rue: string | null;
    nom_rue: string | null;
    complement_adresse: string | null;
    code_postal: string | null;
    ville: string | null;
    row_hash: string;
    legislature_snapshot: number;
}

export interface ActeurAdresseMail {
    acteur_uid: string;
    uid_adresse: string;
    type_code: string | null;
    type_libelle: string | null;
    email: string;
    row_hash: string;
    legislature_snapshot: number;
}

export interface ActeurReseauSocial {
    acteur_uid: string;
    uid_adresse: string;
    type_code: string | null;
    type_libelle: string | null;
    plateforme: string;
    identifiant: string;
    row_hash: string;
    legislature_snapshot: number;
}

export interface ActeurTelephone {
    acteur_uid: string;
    uid_adresse: string;
    type_code: string | null;
    type_libelle: string | null;
    adresse_rattachement: string | null;
    numero: string;
    row_hash: string;
    legislature_snapshot: number;
}