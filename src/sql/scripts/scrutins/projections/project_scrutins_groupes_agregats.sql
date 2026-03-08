INSERT INTO scrutins_groupes_agregats_snapshot (scrutin_uid, groupe_id, groupe_legislature,
                                                pour, contre, abstentions, non_votants,
                                                non_votants_volontaires, row_hash, legislature_snapshot)
SELECT DISTINCT
ON (data ->>'scrutin_uid', data ->>'groupe_id')
    data ->>'scrutin_uid',
    data ->>'groupe_id',
    (data ->>'groupe_legislature'):: integer,
    (data ->>'pour'):: integer,
    (data ->>'contre'):: integer,
    (data ->>'abstentions'):: integer,
    (data ->>'non_votants'):: integer,
    (data ->>'non_votants_volontaires'):: integer,
    data ->>'row_hash',
    (data ->>'legislature_snapshot'):: integer
FROM scrutins_groupes_agregats_raw
ORDER BY data ->>'scrutin_uid', data ->>'groupe_id'
ON CONFLICT (scrutin_uid, groupe_id) DO
UPDATE SET
    groupe_legislature = EXCLUDED.groupe_legislature,
    pour = EXCLUDED.pour,
    contre = EXCLUDED.contre,
    abstentions = EXCLUDED.abstentions,
    non_votants = EXCLUDED.non_votants,
    non_votants_volontaires = EXCLUDED.non_votants_volontaires,
    row_hash = EXCLUDED.row_hash,
    legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE scrutins_groupes_agregats_snapshot.row_hash != EXCLUDED.row_hash;