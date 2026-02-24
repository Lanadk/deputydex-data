-- raw
DROP TABLE IF EXISTS mandats_raw CASCADE;
DROP TABLE IF EXISTS mandats_suppleants_raw CASCADE;

CREATE TABLE mandats_raw (
                             data JSONB NOT NULL
);
CREATE TABLE mandats_suppleants_raw (
                                               data JSONB NOT NULL
);