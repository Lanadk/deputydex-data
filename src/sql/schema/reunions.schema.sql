-- ==============================================================================
-- RAW TABLES
-- ==============================================================================
DROP TABLE IF EXISTS reunions_raw CASCADE;
DROP TABLE IF EXISTS reunions_participants_raw CASCADE;
DROP TABLE IF EXISTS reunions_points_odj_raw CASCADE;
DROP TABLE IF EXISTS reunions_points_odj_dossiers_raw CASCADE;

CREATE TABLE IF NOT EXISTS reunions_raw
(
    data JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS reunions_participants_raw
(
    data JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS reunions_points_odj_raw
(
    data JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS reunions_points_odj_dossiers_raw
(
    data JSONB NOT NULL
);

-- ==============================================================================
-- SNAPSHOT TABLES
-- ==============================================================================
DROP TABLE IF EXISTS reunions_snapshot CASCADE;
DROP TABLE IF EXISTS reunions_participants_snapshot CASCADE;
DROP TABLE IF EXISTS reunions_points_odj_snapshot CASCADE;
DROP TABLE IF EXISTS reunions_points_odj_dossiers_snapshot CASCADE;

CREATE TABLE IF NOT EXISTS reunions_snapshot
(
    uid                        TEXT PRIMARY KEY,
    type_reunion               TEXT        NOT NULL,
    legislature                INTEGER,
    organe_uid                 TEXT        NOT NULL,
    etat                       TEXT,
    date_debut                 TIMESTAMPTZ NOT NULL,
    date_fin                   TIMESTAMPTZ,
    session_ref                TEXT,
    compte_rendu_ref           TEXT,
    lieu_ref                   TEXT,
    lieu_libelle               TEXT,
    format_reunion             TEXT,
    sous_type_reunion          TEXT,
    visio_conference           BOOLEAN,
    captation_video            BOOLEAN,
    ouverture_presse           BOOLEAN,
    est_reunion_internationale BOOLEAN,
    date_seance                DATE,
    id_jo                      TEXT,
    num_seance_jo              INTEGER,
    quantieme                  TEXT,
    resume_odj                 TEXT,
    convocation_odj            TEXT,
    row_hash                   TEXT UNIQUE NOT NULL,
    legislature_snapshot       INTEGER     NOT NULL
);

CREATE TABLE IF NOT EXISTS reunions_participants_snapshot
(
    reunion_uid          TEXT    NOT NULL,
    acteur_uid           TEXT    NOT NULL,
    presence             TEXT    NOT NULL,
    row_hash             TEXT UNIQUE NOT NULL,
    legislature_snapshot INTEGER NOT NULL,
    PRIMARY KEY (reunion_uid, acteur_uid)
);

CREATE TABLE IF NOT EXISTS reunions_points_odj_snapshot
(
    uid                  TEXT PRIMARY KEY,
    reunion_uid          TEXT    NOT NULL,
    ordre                INTEGER NOT NULL,
    type_point           TEXT,
    objet                TEXT,
    etat                 TEXT,
    procedure            TEXT,
    nature_travaux       TEXT,
    comite_secret        BOOLEAN,
    date_conf_pres       DATE,
    row_hash             TEXT UNIQUE NOT NULL,
    legislature_snapshot INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reunions_points_odj_dossiers_snapshot
(
    point_uid            TEXT    NOT NULL,
    reunion_uid          TEXT    NOT NULL,
    dossier_uid          TEXT    NOT NULL,
    row_hash             TEXT UNIQUE NOT NULL,
    legislature_snapshot INTEGER NOT NULL,
    PRIMARY KEY (point_uid, dossier_uid)
);
