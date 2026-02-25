INSERT INTO acteurs_adresses_postales_snapshot (
    acteur_uid,
    uid_adresse,
    type_code,
    type_libelle,
    intitule,
    numero_rue,
    nom_rue,
    complement_adresse,
    code_postal,
    ville,
    row_hash,
    legislature_snapshot
)
SELECT data ->>'acteur_uid', data ->>'uid_adresse', data ->>'type_code', data ->>'type_libelle', data ->>'intitule', data ->>'numero_rue', data ->>'nom_rue', data ->>'complement_adresse', data ->>'code_postal', data ->>'ville', data ->>'row_hash', (data ->>'legislature_snapshot'):: integer
FROM acteurs_adresses_postales_raw
ON CONFLICT (uid_adresse) DO
UPDATE SET
    acteur_uid = EXCLUDED.acteur_uid,
    type_code = EXCLUDED.type_code,
    type_libelle = EXCLUDED.type_libelle,
    intitule = EXCLUDED.intitule,
    numero_rue = EXCLUDED.numero_rue,
    nom_rue = EXCLUDED.nom_rue,
    complement_adresse = EXCLUDED.complement_adresse,
    code_postal = EXCLUDED.code_postal,
    ville = EXCLUDED.ville,
    row_hash = EXCLUDED.row_hash
WHERE acteurs_adresses_postales_snapshot.row_hash != EXCLUDED.row_hash;