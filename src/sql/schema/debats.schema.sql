-- ==============================================================================
-- RAW TABLES
-- ==============================================================================
DROP TABLE IF EXISTS debats_comptes_rendus_raw CASCADE;
DROP TABLE IF EXISTS debats_points_raw CASCADE;
DROP TABLE IF EXISTS debats_interventions_raw CASCADE;
DROP TABLE IF EXISTS debats_interventions_orateurs_raw CASCADE;

CREATE TABLE IF NOT EXISTS debats_comptes_rendus_raw
(
    data JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS debats_points_raw
(
    data JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS debats_interventions_raw
(
    data JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS debats_interventions_orateurs_raw
(
    data JSONB NOT NULL
);

-- ==============================================================================
-- SNAPSHOT TABLES
-- ==============================================================================
DROP TABLE IF EXISTS debats_comptes_rendus_snapshot CASCADE;
DROP TABLE IF EXISTS debats_points_snapshot CASCADE;
DROP TABLE IF EXISTS debats_interventions_snapshot CASCADE;
DROP TABLE IF EXISTS debats_interventions_orateurs_snapshot CASCADE;

CREATE TABLE IF NOT EXISTS debats_comptes_rendus_snapshot
(
    uid                  TEXT PRIMARY KEY,
    seance_uid           TEXT,
    session_ref          TEXT,
    date_seance          TIMESTAMPTZ,
    date_seance_libelle  TEXT,
    num_seance           INTEGER,
    quantieme            TEXT,
    legislature          INTEGER,
    session_libelle      TEXT,
    num_jo               TEXT,
    etat                 TEXT,
    validite             TEXT,
    version              TEXT,
    row_hash             TEXT UNIQUE NOT NULL,
    legislature_snapshot INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS debats_points_snapshot
(
    id                   TEXT PRIMARY KEY,
    compte_rendu_uid     TEXT    NOT NULL,
    parent_id            TEXT,
    profondeur           INTEGER NOT NULL,
    ordre                INTEGER,
    valeur_pts_odj       TEXT,
    code_grammaire       TEXT,
    titre                TEXT,
    row_hash             TEXT UNIQUE NOT NULL,
    legislature_snapshot INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS debats_interventions_snapshot
(
    id                   TEXT PRIMARY KEY,
    compte_rendu_uid     TEXT    NOT NULL,
    point_id             TEXT,
    ordre                INTEGER,
    acteur_uid           TEXT,
    mandat_uid           TEXT,
    role_debat           TEXT,
    code_grammaire       TEXT,
    code_style           TEXT,
    type_debat           TEXT,
    orateurs_libelle     TEXT,
    texte                TEXT,
    stime                NUMERIC(10, 2),
    bibard               TEXT,
    article              TEXT,
    amendement           TEXT,
    sous_amendement      TEXT,
    amendement_uid       TEXT,
    decision             TEXT,
    row_hash             TEXT UNIQUE NOT NULL,
    legislature_snapshot INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS debats_interventions_orateurs_snapshot
(
    intervention_id      TEXT    NOT NULL,
    ordre                INTEGER NOT NULL,
    acteur_uid           TEXT,
    nom                  TEXT,
    qualite              TEXT,
    row_hash             TEXT UNIQUE NOT NULL,
    legislature_snapshot INTEGER NOT NULL,
    PRIMARY KEY (intervention_id, ordre)
);
