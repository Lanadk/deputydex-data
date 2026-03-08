INSERT INTO acteurs_snapshot (
    uid,
    civilite,
    prenom,
    nom,
    nom_alpha,
    trigramme,
    date_naissance,
    ville_naissance,
    departement_naissance,
    pays_naissance,
    date_deces,
    profession_libelle,
    profession_categorie,
    profession_famille,
    uri_hatvp,
    row_hash,
    legislature_snapshot
)
SELECT data ->>'uid', data ->>'civilite', data ->>'prenom', data ->>'nom', data ->>'nom_alpha', data ->>'trigramme', NULLIF (data ->>'date_naissance', ''):: date, data ->>'ville_naissance', data ->>'departement_naissance', data ->>'pays_naissance', NULLIF (data ->>'date_deces', ''):: date, data ->>'profession_libelle', data ->>'profession_categorie', data ->>'profession_famille', data ->>'uri_hatvp', data ->>'row_hash', (data ->>'legislature_snapshot'):: integer
FROM acteurs_raw
ON CONFLICT (uid) DO
UPDATE SET
    civilite = EXCLUDED.civilite,
    prenom = EXCLUDED.prenom,
    nom = EXCLUDED.nom,
    nom_alpha = EXCLUDED.nom_alpha,
    trigramme = EXCLUDED.trigramme,
    date_naissance = EXCLUDED.date_naissance,
    ville_naissance = EXCLUDED.ville_naissance,
    departement_naissance = EXCLUDED.departement_naissance,
    pays_naissance = EXCLUDED.pays_naissance,
    date_deces = EXCLUDED.date_deces,
    profession_libelle = EXCLUDED.profession_libelle,
    profession_categorie = EXCLUDED.profession_categorie,
    profession_famille = EXCLUDED.profession_famille,
    uri_hatvp = EXCLUDED.uri_hatvp,
    row_hash = EXCLUDED.row_hash
WHERE acteurs_snapshot.row_hash != EXCLUDED.row_hash;