INSERT INTO groupes_parlementaires_snapshot (id, legislature, nom, row_hash, legislature_snapshot)
SELECT data ->>'id', (data ->>'legislature_snapshot'):: integer, data ->>'nom', data ->>'row_hash', (data ->>'legislature_snapshot'):: integer
FROM groupes_parlementaires_raw
ON CONFLICT (id, legislature) DO
UPDATE SET
    nom = EXCLUDED.nom,
    row_hash = EXCLUDED.row_hash,
    legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE groupes_parlementaires_snapshot.row_hash != EXCLUDED.row_hash;