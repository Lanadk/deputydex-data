BEGIN;

-- =====================================================
-- MANDATS
-- =====================================================

INSERT INTO mandats (uid, acteur_uid, legislature, type_organe,
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
SELECT uid,
       acteur_uid,
       legislature,
       type_organe,
       date_debut,
       date_fin,
       date_publication,
       preseance,
       nomin_principale,
       code_qualite,
       lib_qualite,
       lib_qualite_sex,
       organe_uid,
       election_region,
       election_region_type,
       election_departement,
       election_num_departement,
       election_num_circo,
       election_cause_mandat,
       election_ref_circonscription,
       mandature_date_prise_fonction,
       mandature_cause_fin,
       mandature_premiere_election,
       mandature_place_hemicycle,
       mandature_mandat_remplace_ref,
       row_hash,
       legislature_snapshot
FROM mandats_snapshot ON CONFLICT (uid) DO
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
WHERE mandats.row_hash != EXCLUDED.row_hash;

-- CASCADE → mandats_suppleants
CREATE
TEMP TABLE tmp_mandats_to_delete AS
SELECT m.uid
FROM mandats m
WHERE m.legislature_snapshot IN (SELECT number FROM param_current_legislatures)
  AND NOT EXISTS (SELECT 1 FROM mandats_snapshot s WHERE s.uid = m.uid);

DELETE
FROM mandats m USING tmp_mandats_to_delete x
WHERE m.uid = x.uid;
DROP TABLE tmp_mandats_to_delete;

-- =====================================================
-- MANDATS SUPPLEANTS
-- =====================================================

INSERT INTO mandats_suppleants (mandat_uid, suppleant_uid, date_debut, date_fin,
                                row_hash, legislature_snapshot)
SELECT mandat_uid,
       suppleant_uid,
       date_debut,
       date_fin,
       row_hash,
       legislature_snapshot
FROM mandats_suppleants_snapshot ON CONFLICT (mandat_uid, suppleant_uid) DO
UPDATE SET
    date_debut = EXCLUDED.date_debut,
    date_fin = EXCLUDED.date_fin,
    row_hash = EXCLUDED.row_hash,
    legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE mandats_suppleants.row_hash != EXCLUDED.row_hash;

COMMIT;