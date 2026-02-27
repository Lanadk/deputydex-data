INSERT INTO scrutins_agregats_snapshot (scrutin_uid, nombre_votants, suffrages_exprimes,
                                        suffrages_requis, total_pour, total_contre,
                                        total_abstentions, total_non_votants,
                                        total_non_votants_volontaires, row_hash, legislature_snapshot)
SELECT data ->>'scrutin_uid', (data ->>'nombre_votants'):: integer, (data ->>'suffrages_exprimes'):: integer, (data ->>'suffrages_requis'):: integer, (data ->>'total_pour'):: integer, (data ->>'total_contre'):: integer, (data ->>'total_abstentions'):: integer, (data ->>'total_non_votants'):: integer, (data ->>'total_non_votants_volontaires'):: integer, data ->>'row_hash', (data ->>'legislature_snapshot'):: integer
FROM scrutins_agregats_raw
ON CONFLICT (scrutin_uid) DO
UPDATE SET
    nombre_votants = EXCLUDED.nombre_votants,
    suffrages_exprimes = EXCLUDED.suffrages_exprimes,
    suffrages_requis = EXCLUDED.suffrages_requis,
    total_pour = EXCLUDED.total_pour,
    total_contre = EXCLUDED.total_contre,
    total_abstentions = EXCLUDED.total_abstentions,
    total_non_votants = EXCLUDED.total_non_votants,
    total_non_votants_volontaires = EXCLUDED.total_non_votants_volontaires,
    row_hash = EXCLUDED.row_hash,
    legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE scrutins_agregats_snapshot.row_hash != EXCLUDED.row_hash;