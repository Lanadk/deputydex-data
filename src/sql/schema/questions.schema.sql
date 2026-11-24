-- ==============================================================================
-- RAW TABLES
-- ==============================================================================
DROP TABLE IF EXISTS questions_raw CASCADE;
DROP TABLE IF EXISTS questions_ministeres_attributaires_raw CASCADE;

CREATE TABLE IF NOT EXISTS questions_raw
(
    data JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS questions_ministeres_attributaires_raw
(
    data JSONB NOT NULL
);

-- ==============================================================================
-- SNAPSHOT TABLES
-- ==============================================================================
DROP TABLE IF EXISTS questions_snapshot CASCADE;
DROP TABLE IF EXISTS questions_ministeres_attributaires_snapshot CASCADE;

CREATE TABLE IF NOT EXISTS questions_snapshot
(
    uid                         TEXT PRIMARY KEY,
    type_question               TEXT    NOT NULL,
    legislature                 INTEGER,
    numero                      INTEGER,
    acteur_uid                  TEXT    NOT NULL,
    mandat_uid                  TEXT,
    groupe_uid                  TEXT,
    groupe_abrege               TEXT,
    rubrique                    TEXT,
    tete_analyse                TEXT,
    libelle_analyse             TEXT,
    ministere_uid               TEXT,
    ministere_abrege            TEXT,
    date_question               DATE,
    texte_question              TEXT,
    date_reponse                DATE,
    type_jo_reponse             TEXT,
    page_jo_reponse             TEXT,
    texte_reponse               TEXT,
    code_cloture                TEXT,
    libelle_cloture             TEXT,
    date_cloture                DATE,
    nb_renouvellements          INTEGER NOT NULL,
    date_dernier_renouvellement DATE,
    date_signalement            DATE,
    row_hash                    TEXT UNIQUE NOT NULL,
    legislature_snapshot        INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS questions_ministeres_attributaires_snapshot
(
    question_uid         TEXT    NOT NULL,
    ordre                INTEGER NOT NULL,
    ministere_uid        TEXT,
    ministere_abrege     TEXT,
    date_jo              DATE,
    row_hash             TEXT UNIQUE NOT NULL,
    legislature_snapshot INTEGER NOT NULL,
    PRIMARY KEY (question_uid, ordre)
);
