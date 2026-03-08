INSERT INTO acteurs_adresses_mails_snapshot (
    acteur_uid,
    uid_adresse,
    type_code,
    type_libelle,
    email,
    row_hash,
    legislature_snapshot
)
SELECT data ->>'acteur_uid', data ->>'uid_adresse', data ->>'type_code', data ->>'type_libelle', data ->>'email', data ->>'row_hash', (data ->>'legislature_snapshot'):: integer
FROM acteurs_adresses_mails_raw
ON CONFLICT (uid_adresse) DO
UPDATE SET
    acteur_uid = EXCLUDED.acteur_uid,
    type_code = EXCLUDED.type_code,
    type_libelle = EXCLUDED.type_libelle,
    email = EXCLUDED.email,
    row_hash = EXCLUDED.row_hash
WHERE acteurs_adresses_mails_snapshot.row_hash != EXCLUDED.row_hash;