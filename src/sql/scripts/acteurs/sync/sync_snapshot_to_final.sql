BEGIN;

-- =====================================================
-- ACTEURS (delete on acteurs = cascade on other --> see prisma schema)
-- =====================================================

INSERT INTO acteurs (uid, civilite, prenom, nom, nom_alpha, trigramme, date_naissance,
                     ville_naissance, departement_naissance, pays_naissance, date_deces,
                     profession_libelle, profession_categorie, profession_famille, uri_hatvp,
                     row_hash, legislature_snapshot)
SELECT uid,
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
FROM acteurs_snapshot ON CONFLICT (uid) DO
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
    row_hash = EXCLUDED.row_hash,
    legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE acteurs.row_hash != EXCLUDED.row_hash;

CREATE
TEMP TABLE tmp_acteurs_to_delete AS
SELECT a.uid
FROM acteurs a
WHERE a.legislature_snapshot IN (SELECT number FROM param_current_legislatures)
  AND NOT EXISTS (SELECT 1 FROM acteurs_snapshot s WHERE s.uid = a.uid);

DELETE
FROM acteurs a USING tmp_acteurs_to_delete x
WHERE a.uid = x.uid;
DROP TABLE tmp_acteurs_to_delete;

-- =====================================================
-- ADRESSES POSTALES
-- =====================================================

INSERT INTO acteurs_adresses_postales (acteur_uid, uid_adresse, type_code, type_libelle,
                                       intitule, numero_rue, nom_rue, complement_adresse,
                                       code_postal, ville, row_hash, legislature_snapshot)
SELECT acteur_uid,
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
FROM acteurs_adresses_postales_snapshot ON CONFLICT (uid_adresse) DO
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
    row_hash = EXCLUDED.row_hash,
    legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE acteurs_adresses_postales.row_hash != EXCLUDED.row_hash;

-- =====================================================
-- ADRESSES MAILS
-- =====================================================

INSERT INTO acteurs_adresses_mails (acteur_uid, uid_adresse, type_code, type_libelle,
                                    email, row_hash, legislature_snapshot)
SELECT acteur_uid,
       uid_adresse,
       type_code,
       type_libelle,
       email,
       row_hash,
       legislature_snapshot
FROM acteurs_adresses_mails_snapshot ON CONFLICT (uid_adresse) DO
UPDATE SET
    acteur_uid = EXCLUDED.acteur_uid,
    type_code = EXCLUDED.type_code,
    type_libelle = EXCLUDED.type_libelle,
    email = EXCLUDED.email,
    row_hash = EXCLUDED.row_hash,
    legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE acteurs_adresses_mails.row_hash != EXCLUDED.row_hash;

-- =====================================================
-- RESEAUX SOCIAUX
-- =====================================================

INSERT INTO acteurs_reseaux_sociaux (acteur_uid, uid_adresse, type_code, type_libelle,
                                     plateforme, identifiant, row_hash, legislature_snapshot)
SELECT acteur_uid,
       uid_adresse,
       type_code,
       type_libelle,
       plateforme,
       identifiant,
       row_hash,
       legislature_snapshot
FROM acteurs_reseaux_sociaux_snapshot ON CONFLICT (uid_adresse) DO
UPDATE SET
    acteur_uid = EXCLUDED.acteur_uid,
    type_code = EXCLUDED.type_code,
    type_libelle = EXCLUDED.type_libelle,
    plateforme = EXCLUDED.plateforme,
    identifiant = EXCLUDED.identifiant,
    row_hash = EXCLUDED.row_hash,
    legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE acteurs_reseaux_sociaux.row_hash != EXCLUDED.row_hash;

-- =====================================================
-- TELEPHONES
-- =====================================================

INSERT INTO acteurs_telephones (acteur_uid, uid_adresse, type_code, type_libelle,
                                adresse_rattachement, numero, row_hash, legislature_snapshot)
SELECT acteur_uid,
       uid_adresse,
       type_code,
       type_libelle,
       adresse_rattachement,
       numero,
       row_hash,
       legislature_snapshot
FROM acteurs_telephones_snapshot ON CONFLICT (uid_adresse) DO
UPDATE SET
    acteur_uid = EXCLUDED.acteur_uid,
    type_code = EXCLUDED.type_code,
    type_libelle = EXCLUDED.type_libelle,
    adresse_rattachement = EXCLUDED.adresse_rattachement,
    numero = EXCLUDED.numero,
    row_hash = EXCLUDED.row_hash,
    legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE acteurs_telephones.row_hash != EXCLUDED.row_hash;

COMMIT;