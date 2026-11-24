INSERT INTO debats_interventions_orateurs_snapshot (intervention_id, ordre, acteur_uid, nom, qualite, row_hash,
                                                    legislature_snapshot)
SELECT data ->> 'intervention_id',
       (data ->> 'ordre')::integer,
       data ->> 'acteur_uid',
       data ->> 'nom',
       data ->> 'qualite',
       data ->> 'row_hash',
       (data ->> 'legislature_snapshot')::integer
FROM debats_interventions_orateurs_raw
ON CONFLICT (intervention_id, ordre) DO UPDATE SET acteur_uid           = EXCLUDED.acteur_uid,
                                                   nom                  = EXCLUDED.nom,
                                                   qualite              = EXCLUDED.qualite,
                                                   row_hash             = EXCLUDED.row_hash,
                                                   legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE debats_interventions_orateurs_snapshot.row_hash != EXCLUDED.row_hash;
