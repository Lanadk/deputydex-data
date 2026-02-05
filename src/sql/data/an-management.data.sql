INSERT INTO param_legislatures (number, is_current)
VALUES (16, false),
       (17, true);


INSERT INTO ref_data_domains (code, description)
VALUES ('acteurs', 'Personne physique'),
       ('votes', 'Votes et scrutins publics');


-- Insérer les sources de données pour la législature 16 (archive)
INSERT INTO param_data_sources (domain_id, legislature_id, download_url, file_name)
VALUES
    (
        (SELECT id FROM ref_data_domains WHERE code = 'acteurs'),
        (SELECT id FROM param_legislatures WHERE number = 16),
        'https://data.assemblee-nationale.fr/static/openData/repository/16/amo/acteurs_mandats_organes_divises/AMO50_acteurs_mandats_organes_divises.json.zip',
        'AMO50_acteurs_mandats_organes_divises.json.zip'
    ),
    (
        (SELECT id FROM ref_data_domains WHERE code = 'votes'),
        (SELECT id FROM param_legislatures WHERE number = 16),
        'https://data.assemblee-nationale.fr/static/openData/repository/16/loi/scrutins/Scrutins.json.zip',
        'Scrutins.json.zip'
    );

-- Insérer les sources de données pour la législature 17 (current)
INSERT INTO param_data_sources (domain_id, legislature_id, download_url, file_name)
VALUES
    (
        (SELECT id FROM ref_data_domains WHERE code = 'acteurs'),
        (SELECT id FROM param_legislatures WHERE number = 17),
        'https://data.assemblee-nationale.fr/static/openData/repository/17/amo/acteurs_mandats_organes_divises/AMO50_acteurs_mandats_organes_divises.json.zip',
        'AMO50_acteurs_mandats_organes_divises.json.zip'
    ),
    (
        (SELECT id FROM ref_data_domains WHERE code = 'votes'),
        (SELECT id FROM param_legislatures WHERE number = 17),
        'https://data.assemblee-nationale.fr/static/openData/repository/17/loi/scrutins/Scrutins.json.zip',
        'Scrutins.json.zip'
    );