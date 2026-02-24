export interface Mandat {
    uid: string;
    acteur_uid: string;
    legislature: number;
    type_organe: string;
    date_debut: string;
    date_fin: string | null;
    date_publication: string | null;
    preseance: number;
    nomin_principale: number;
    code_qualite: string;
    lib_qualite: string;
    lib_qualite_sex: string;
    organe_uid: string;

    // Élection
    election_region: string | null;
    election_region_type: string | null;
    election_departement: string | null;
    election_num_departement: string | null;
    election_num_circo: string | null;
    election_cause_mandat: string | null;
    election_ref_circonscription: string | null;

    // Mandature
    mandature_date_prise_fonction: string | null;
    mandature_cause_fin: string | null;
    mandature_premiere_election: boolean | null;
    mandature_place_hemicycle: string | null;
    mandature_mandat_remplace_ref: string | null;
}

export interface MandatSuppleant {
    mandat_uid: string;
    suppleant_uid: string;
    date_debut: string;
    date_fin: string | null;
}