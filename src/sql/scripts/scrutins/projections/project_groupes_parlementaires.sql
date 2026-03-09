INSERT INTO groupes_parlementaires_snapshot (id, legislature_snapshot, row_hash)
SELECT data ->>'id', (data ->>'legislature_snapshot'):: integer, data ->>'row_hash'
FROM groupes_parlementaires_raw
ON CONFLICT (id) DO
UPDATE SET
    legislature_snapshot = EXCLUDED.legislature_snapshot,
    row_hash = EXCLUDED.row_hash
WHERE groupes_parlementaires_snapshot.row_hash != EXCLUDED.row_hash;