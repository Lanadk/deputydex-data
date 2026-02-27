-- ==============================================================================
-- RAW TABLES
-- ==============================================================================
DROP TABLE IF EXISTS acteurs_raw CASCADE;
DROP TABLE IF EXISTS acteurs_adresses_postales_raw CASCADE;
DROP TABLE IF EXISTS acteurs_adresses_mails_raw CASCADE;
DROP TABLE IF EXISTS acteurs_reseaux_sociaux_raw CASCADE;
DROP TABLE IF EXISTS acteurs_telephones_raw CASCADE;

CREATE TABLE acteurs_raw
(
    data JSONB NOT NULL
);
CREATE TABLE acteurs_adresses_postales_raw
(
    data JSONB NOT NULL
);
CREATE TABLE acteurs_adresses_mails_raw
(
    data JSONB NOT NULL
);
CREATE TABLE acteurs_reseaux_sociaux_raw
(
    data JSONB NOT NULL
);
CREATE TABLE acteurs_telephones_raw
(
    data JSONB NOT NULL
);

-- ==============================================================================
-- SNAPSHOT TABLES
-- ==============================================================================
DROP TABLE IF EXISTS acteurs_snapshot CASCADE;
DROP TABLE IF EXISTS acteurs_adresses_postales_snapshot CASCADE;
DROP TABLE IF EXISTS acteurs_adresses_mails_snapshot CASCADE;
DROP TABLE IF EXISTS acteurs_reseaux_sociaux_snapshot CASCADE;
DROP TABLE IF EXISTS acteurs_telephones_snapshot CASCADE;

CREATE TABLE acteurs_snapshot
(
    uid                   TEXT PRIMARY KEY,
    civilite              TEXT,
    prenom                TEXT,
    nom                   TEXT,
    nom_alpha             TEXT,
    trigramme             TEXT,
    date_naissance        DATE,
    ville_naissance       TEXT,
    departement_naissance TEXT,
    pays_naissance        TEXT,
    date_deces            DATE,
    profession_libelle    TEXT,
    profession_categorie  TEXT,
    profession_famille    TEXT,
    uri_hatvp             TEXT,
    row_hash              TEXT,
    legislature_snapshot  INTEGER NOT NULL
);

CREATE TABLE acteurs_adresses_postales_snapshot
(
    acteur_uid           TEXT,
    uid_adresse          TEXT PRIMARY KEY,
    type_code            TEXT,
    type_libelle         TEXT,
    intitule             TEXT,
    numero_rue           TEXT,
    nom_rue              TEXT,
    complement_adresse   TEXT,
    code_postal          TEXT,
    ville                TEXT,
    row_hash             TEXT,
    legislature_snapshot INTEGER NOT NULL
);

CREATE TABLE acteurs_adresses_mails_snapshot
(
    acteur_uid           TEXT,
    uid_adresse          TEXT PRIMARY KEY,
    type_code            TEXT,
    type_libelle         TEXT,
    email                TEXT,
    row_hash             TEXT,
    legislature_snapshot INTEGER NOT NULL
);

CREATE TABLE acteurs_reseaux_sociaux_snapshot
(
    acteur_uid           TEXT,
    uid_adresse          TEXT PRIMARY KEY,
    type_code            TEXT,
    type_libelle         TEXT,
    plateforme           TEXT,
    identifiant          TEXT,
    row_hash             TEXT,
    legislature_snapshot INTEGER NOT NULL
);

CREATE TABLE acteurs_telephones_snapshot
(
    acteur_uid           TEXT,
    uid_adresse          TEXT PRIMARY KEY,
    type_code            TEXT,
    type_libelle         TEXT,
    adresse_rattachement TEXT,
    numero               TEXT,
    row_hash             TEXT,
    legislature_snapshot INTEGER NOT NULL
);
