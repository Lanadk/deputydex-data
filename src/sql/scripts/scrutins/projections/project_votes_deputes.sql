INSERT INTO votes_deputes_snapshot (scrutin_uid, depute_id, groupe_id, groupe_legislature,
                                    mandat_ref, position, cause_position, par_delegation,
                                    row_hash, legislature_snapshot)
SELECT data ->>'scrutin_uid', data ->>'depute_id', data ->>'groupe_id', (data ->>'groupe_legislature'):: integer, data ->>'mandat_ref', data ->>'position', data ->>'cause_position', (data ->>'par_delegation')::boolean, data ->>'row_hash', (data ->>'legislature_snapshot'):: integer
FROM votes_deputes_raw
ON CONFLICT (scrutin_uid, depute_id) DO
UPDATE SET
    groupe_id = EXCLUDED.groupe_id,
    groupe_legislature = EXCLUDED.groupe_legislature,
    mandat_ref = EXCLUDED.mandat_ref,
    position = EXCLUDED.position,
    cause_position = EXCLUDED.cause_position,
    par_delegation = EXCLUDED.par_delegation,
    row_hash = EXCLUDED.row_hash,
    legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE votes_deputes_snapshot.row_hash != EXCLUDED.row_hash;