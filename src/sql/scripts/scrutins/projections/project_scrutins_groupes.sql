INSERT INTO scrutins_groupes_snapshot (scrutin_uid, groupe_id, groupe_legislature,
                                       nombre_membres, position_majoritaire,
                                       row_hash, legislature_snapshot)
SELECT DISTINCT
ON (data ->>'scrutin_uid', data ->>'groupe_id')
    data ->>'scrutin_uid',
    data ->>'groupe_id',
    (data ->>'groupe_legislature'):: integer,
    (data ->>'nombre_membres'):: integer,
    data ->>'position_majoritaire',
    data ->>'row_hash',
    (data ->>'legislature_snapshot'):: integer
FROM scrutins_groupes_raw
ORDER BY data ->>'scrutin_uid', data ->>'groupe_id'
ON CONFLICT (scrutin_uid, groupe_id) DO
UPDATE SET
    groupe_legislature = EXCLUDED.groupe_legislature,
    nombre_membres = EXCLUDED.nombre_membres,
    position_majoritaire = EXCLUDED.position_majoritaire,
    row_hash = EXCLUDED.row_hash,
    legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE scrutins_groupes_snapshot.row_hash != EXCLUDED.row_hash;