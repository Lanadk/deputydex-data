INSERT INTO reunions_participants_snapshot (reunion_uid, acteur_uid, presence, row_hash, legislature_snapshot)
SELECT data ->> 'reunion_uid',
       data ->> 'acteur_uid',
       data ->> 'presence',
       data ->> 'row_hash',
       (data ->> 'legislature_snapshot')::integer
FROM reunions_participants_raw
ON CONFLICT (reunion_uid, acteur_uid) DO UPDATE SET presence             = EXCLUDED.presence,
                                                    row_hash             = EXCLUDED.row_hash,
                                                    legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE reunions_participants_snapshot.row_hash != EXCLUDED.row_hash;
