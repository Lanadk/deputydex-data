INSERT INTO deputes_snapshot (id, row_hash, legislature_snapshot)
SELECT data ->>'id', data ->>'row_hash', (data ->>'legislature_snapshot'):: integer
FROM deputes_raw
ON CONFLICT (id) DO
UPDATE SET
    row_hash = EXCLUDED.row_hash,
    legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE deputes_snapshot.row_hash != EXCLUDED.row_hash;