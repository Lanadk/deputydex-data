INSERT INTO mandats_snapshot (uid, acteur_uid, legislature, type_organe,
                              date_debut, date_fin, date_publication,
                              preseance, nomin_principale,
                              code_qualite, lib_qualite, lib_qualite_sex,
                              organe_uid,
                              election_region, election_region_type, election_departement,
                              election_num_departement, election_num_circo,
                              election_cause_mandat, election_ref_circonscription,
                              mandature_date_prise_fonction, mandature_cause_fin,
                              mandature_premiere_election, mandature_place_hemicycle,
                              mandature_mandat_remplace_ref,
                              row_hash, legislature_snapshot)
SELECT data ->>'uid', data ->>'acteur_uid', (data ->>'legislature'):: integer, data ->>'type_organe', NULLIF (data ->>'date_debut', ''):: date, NULLIF (data ->>'date_fin', ''):: date, NULLIF (data ->>'date_publication', ''):: date, (data ->>'preseance'):: integer, (data ->>'nomin_principale'):: integer, data ->>'code_qualite', data ->>'lib_qualite', data ->>'lib_qualite_sex', data ->>'organe_uid', data ->>'election_region', data ->>'election_region_type', data ->>'election_departement', data ->>'election_num_departement', data ->>'election_num_circo', data ->>'election_cause_mandat', data ->>'election_ref_circonscription', NULLIF (data ->>'mandature_date_prise_fonction', ''):: date, data ->>'mandature_cause_fin', CASE
    WHEN data ->>'mandature_premiere_election' = 'true' THEN true
    WHEN data ->>'mandature_premiere_election' = 'false' THEN false
    ELSE NULL
END
,
    data->>'mandature_place_hemicycle',
    data->>'mandature_mandat_remplace_ref',
    data->>'row_hash',
    (data->>'legislature_snapshot')::integer
FROM mandats_raw
ON CONFLICT (uid) DO
UPDATE SET
    acteur_uid = EXCLUDED.acteur_uid,
    legislature = EXCLUDED.legislature,
    type_organe = EXCLUDED.type_organe,
    date_debut = EXCLUDED.date_debut,
    date_fin = EXCLUDED.date_fin,
    date_publication = EXCLUDED.date_publication,
    preseance = EXCLUDED.preseance,
    nomin_principale = EXCLUDED.nomin_principale,
    code_qualite = EXCLUDED.code_qualite,
    lib_qualite = EXCLUDED.lib_qualite,
    lib_qualite_sex = EXCLUDED.lib_qualite_sex,
    organe_uid = EXCLUDED.organe_uid,
    election_region = EXCLUDED.election_region,
    election_region_type = EXCLUDED.election_region_type,
    election_departement = EXCLUDED.election_departement,
    election_num_departement = EXCLUDED.election_num_departement,
    election_num_circo = EXCLUDED.election_num_circo,
    election_cause_mandat = EXCLUDED.election_cause_mandat,
    election_ref_circonscription = EXCLUDED.election_ref_circonscription,
    mandature_date_prise_fonction = EXCLUDED.mandature_date_prise_fonction,
    mandature_cause_fin = EXCLUDED.mandature_cause_fin,
    mandature_premiere_election = EXCLUDED.mandature_premiere_election,
    mandature_place_hemicycle = EXCLUDED.mandature_place_hemicycle,
    mandature_mandat_remplace_ref = EXCLUDED.mandature_mandat_remplace_ref,
    row_hash = EXCLUDED.row_hash,
    legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE mandats_snapshot.row_hash != EXCLUDED.row_hash;