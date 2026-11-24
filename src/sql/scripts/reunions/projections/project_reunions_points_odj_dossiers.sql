INSERT INTO reunions_points_odj_dossiers_snapshot (point_uid, reunion_uid, dossier_uid, row_hash, legislature_snapshot)
SELECT data ->> 'point_uid',
       data ->> 'reunion_uid',
       data ->> 'dossier_uid',
       data ->> 'row_hash',
       (data ->> 'legislature_snapshot')::integer
FROM reunions_points_odj_dossiers_raw
ON CONFLICT (point_uid, dossier_uid) DO UPDATE SET reunion_uid          = EXCLUDED.reunion_uid,
                                                   row_hash             = EXCLUDED.row_hash,
                                                   legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE reunions_points_odj_dossiers_snapshot.row_hash != EXCLUDED.row_hash;
