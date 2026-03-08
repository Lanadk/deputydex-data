INSERT INTO acteurs_reseaux_sociaux_snapshot (
    acteur_uid,
    uid_adresse,
    type_code,
    type_libelle,
    plateforme,
    identifiant,
    row_hash,
    legislature_snapshot
)
SELECT data ->>'acteur_uid', data ->>'uid_adresse', data ->>'type_code', data ->>'type_libelle', data ->>'plateforme', data ->>'identifiant', data ->>'row_hash', (data ->>'legislature_snapshot'):: integer
FROM acteurs_reseaux_sociaux_raw
ON CONFLICT (uid_adresse) DO
UPDATE SET
    acteur_uid = EXCLUDED.acteur_uid,
    type_code = EXCLUDED.type_code,
    type_libelle = EXCLUDED.type_libelle,
    plateforme = EXCLUDED.plateforme,
    identifiant = EXCLUDED.identifiant,
    row_hash = EXCLUDED.row_hash
WHERE acteurs_reseaux_sociaux_snapshot.row_hash != EXCLUDED.row_hash;