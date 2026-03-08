INSERT INTO mandats_suppleants_snapshot (mandat_uid, suppleant_uid, date_debut, date_fin,
                                         row_hash, legislature_snapshot)
SELECT data ->>'mandat_uid', data ->>'suppleant_uid', NULLIF (data ->>'date_debut', ''):: date, NULLIF (data ->>'date_fin', ''):: date, data ->>'row_hash', (data ->>'legislature_snapshot'):: integer
FROM mandats_suppleants_raw
ON CONFLICT (mandat_uid, suppleant_uid) DO
UPDATE SET
    date_debut = EXCLUDED.date_debut,
    date_fin = EXCLUDED.date_fin,
    row_hash = EXCLUDED.row_hash,
    legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE mandats_suppleants_snapshot.row_hash != EXCLUDED.row_hash;