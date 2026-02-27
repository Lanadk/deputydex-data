INSERT INTO acteurs_telephones_snapshot (
    acteur_uid,
    uid_adresse,
    type_code,
    type_libelle,
    adresse_rattachement,
    numero,
    row_hash,
    legislature_snapshot
)
SELECT data ->>'acteur_uid', data ->>'uid_adresse', data ->>'type_code', data ->>'type_libelle', data ->>'adresse_rattachement', data ->>'numero', data ->>'row_hash', (data ->>'legislature_snapshot'):: integer
FROM acteurs_telephones_raw
ON CONFLICT (uid_adresse) DO
UPDATE SET
    acteur_uid = EXCLUDED.acteur_uid,
    type_code = EXCLUDED.type_code,
    type_libelle = EXCLUDED.type_libelle,
    adresse_rattachement = EXCLUDED.adresse_rattachement,
    numero = EXCLUDED.numero,
    row_hash = EXCLUDED.row_hash
WHERE acteurs_telephones_snapshot.row_hash != EXCLUDED.row_hash;