INSERT INTO scrutins_snapshot (uid, numero, legislature, date_scrutin, titre,
                               type_scrutin_code, type_scrutin_libelle, type_majorite,
                               resultat_code, resultat_libelle, row_hash, legislature_snapshot)
SELECT data ->>'uid', data ->>'numero', data ->>'legislature', NULLIF (data ->>'date_scrutin', ''):: date, data ->>'titre', data ->>'type_scrutin_code', data ->>'type_scrutin_libelle', data ->>'type_majorite', data ->>'resultat_code', data ->>'resultat_libelle', data ->>'row_hash', (data ->>'legislature_snapshot'):: integer
FROM scrutins_raw
ON CONFLICT (uid) DO
UPDATE SET
    numero = EXCLUDED.numero,
    legislature = EXCLUDED.legislature,
    date_scrutin = EXCLUDED.date_scrutin,
    titre = EXCLUDED.titre,
    type_scrutin_code = EXCLUDED.type_scrutin_code,
    type_scrutin_libelle = EXCLUDED.type_scrutin_libelle,
    type_majorite = EXCLUDED.type_majorite,
    resultat_code = EXCLUDED.resultat_code,
    resultat_libelle = EXCLUDED.resultat_libelle,
    row_hash = EXCLUDED.row_hash,
    legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE scrutins_snapshot.row_hash != EXCLUDED.row_hash;