-- Organes du jeu AMO (commissions, groupes, ministères, gouvernements…).
-- Un même organe figure dans les archives de plusieurs législatures : la
-- dernière importée (ordre croissant des législatures) l'emporte.
INSERT INTO organes_snapshot (uid, code_type, libelle, libelle_edition, libelle_abrege, libelle_abrev,
                              date_debut, date_fin, organe_parent_uid, organe_precedent_uid,
                              preseance, legislature, row_hash, legislature_snapshot)
SELECT data ->> 'uid',
       data ->> 'code_type',
       data ->> 'libelle',
       data ->> 'libelle_edition',
       data ->> 'libelle_abrege',
       data ->> 'libelle_abrev',
       (data ->> 'date_debut')::date,
       (data ->> 'date_fin')::date,
       data ->> 'organe_parent_uid',
       data ->> 'organe_precedent_uid',
       (data ->> 'preseance')::integer,
       (data ->> 'legislature')::integer,
       data ->> 'row_hash',
       (data ->> 'legislature_snapshot')::integer
FROM organes_raw
ON CONFLICT (uid) DO UPDATE SET code_type            = EXCLUDED.code_type,
                                libelle              = EXCLUDED.libelle,
                                libelle_edition      = EXCLUDED.libelle_edition,
                                libelle_abrege       = EXCLUDED.libelle_abrege,
                                libelle_abrev        = EXCLUDED.libelle_abrev,
                                date_debut           = EXCLUDED.date_debut,
                                date_fin             = EXCLUDED.date_fin,
                                organe_parent_uid    = EXCLUDED.organe_parent_uid,
                                organe_precedent_uid = EXCLUDED.organe_precedent_uid,
                                preseance            = EXCLUDED.preseance,
                                legislature          = EXCLUDED.legislature,
                                row_hash             = EXCLUDED.row_hash,
                                legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE organes_snapshot.row_hash != EXCLUDED.row_hash;
