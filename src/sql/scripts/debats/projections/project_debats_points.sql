INSERT INTO debats_points_snapshot (id, compte_rendu_uid, parent_id, profondeur, ordre, valeur_pts_odj, code_grammaire,
                                    titre, row_hash, legislature_snapshot)
SELECT data ->> 'id',
       data ->> 'compte_rendu_uid',
       data ->> 'parent_id',
       (data ->> 'profondeur')::integer,
       (data ->> 'ordre')::integer,
       data ->> 'valeur_pts_odj',
       data ->> 'code_grammaire',
       data ->> 'titre',
       data ->> 'row_hash',
       (data ->> 'legislature_snapshot')::integer
FROM debats_points_raw
ON CONFLICT (id) DO UPDATE SET compte_rendu_uid     = EXCLUDED.compte_rendu_uid,
                               parent_id            = EXCLUDED.parent_id,
                               profondeur           = EXCLUDED.profondeur,
                               ordre                = EXCLUDED.ordre,
                               valeur_pts_odj       = EXCLUDED.valeur_pts_odj,
                               code_grammaire       = EXCLUDED.code_grammaire,
                               titre                = EXCLUDED.titre,
                               row_hash             = EXCLUDED.row_hash,
                               legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE debats_points_snapshot.row_hash != EXCLUDED.row_hash;
