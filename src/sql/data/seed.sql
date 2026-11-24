-- ============================================
-- SEED DATA - Données statiques de référence
-- ============================================
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================
-- LÉGISLATURES
-- ============================================

INSERT INTO param_legislatures (number, start_date, end_date)
VALUES
    (16, '2022-06-28', '2024-06-09'),
    (17, '2024-07-18', NULL)
ON CONFLICT (number) DO NOTHING;

-- ============================================
-- LÉGISLATURE COURANTE
-- ============================================

INSERT INTO param_current_legislatures (legislature_id, number)
VALUES (
           (SELECT id FROM param_legislatures WHERE number = 17),
           17
       )
ON CONFLICT (legislature_id) DO UPDATE SET number = EXCLUDED.number;

-- ============================================
-- DOMAINES DE DONNÉES
-- ============================================

INSERT INTO ref_data_domains (code, description)
VALUES
    ('acteurs', 'Deputes sénateurs ministres mandats organes'),
    ('scrutins', 'Votes et scrutins publics'),
    ('amendements', 'Ammendements législatifs'),
    ('dossiers_legislatifs', 'Dossier législatif'),
    ('documents_legislatifs', 'Documents législatif'),
    ('reunions', 'Agenda : réunions de commission, séances publiques, groupes d''études'),
    ('questions_gouvernement', 'Questions au Gouvernement'),
    ('questions_orales_sans_debat', 'Questions orales sans débat'),
    ('questions_ecrites', 'Questions écrites'),
    ('debats', 'Comptes rendus intégraux des séances publiques (Syceron)')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- SOURCES DE DONNÉES - Législature 16
-- ============================================

INSERT INTO param_data_sources (domain_id, legislature_id, download_url, file_name)
VALUES
    (
        (SELECT id FROM ref_data_domains WHERE code = 'acteurs'),
        (SELECT id FROM param_legislatures WHERE number = 16),
        'https://data.assemblee-nationale.fr/static/openData/repository/16/amo/deputes_senateurs_ministres_legislature/AMO20_dep_sen_min_tous_mandats_et_organes.json.zip',
        'AMO20_dep_sen_min_tous_mandats_et_organes.json.zip'
    ),
    (
        (SELECT id FROM ref_data_domains WHERE code = 'scrutins'),
        (SELECT id FROM param_legislatures WHERE number = 16),
        'https://data.assemblee-nationale.fr/static/openData/repository/16/loi/scrutins/Scrutins.json.zip',
        'Scrutins.json.zip'
    ),
    (
        (SELECT id FROM ref_data_domains WHERE code = 'amendements'),
        (SELECT id FROM param_legislatures WHERE number = 16),
        'https://data.assemblee-nationale.fr/static/openData/repository/16/loi/amendements_div_legis/Amendements.json.zip',
        'Amendements.json.zip'
    ),
    (
        (SELECT id FROM ref_data_domains WHERE code = 'dossiers_legislatifs'),
        (SELECT id FROM param_legislatures WHERE number = 16),
        'https://data.assemblee-nationale.fr/static/openData/repository/16/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip',
        'Dossiers_Legislatifs.json.zip'
    ),
    (
        (SELECT id FROM ref_data_domains WHERE code = 'reunions'),
        (SELECT id FROM param_legislatures WHERE number = 16),
        'https://data.assemblee-nationale.fr/static/openData/repository/16/vp/reunions/Agenda.json.zip',
        'Agenda.json.zip'
    ),
    (
        (SELECT id FROM ref_data_domains WHERE code = 'questions_gouvernement'),
        (SELECT id FROM param_legislatures WHERE number = 16),
        'https://data.assemblee-nationale.fr/static/openData/repository/16/questions/questions_gouvernement/Questions_gouvernement.json.zip',
        'Questions_gouvernement.json.zip'
    ),
    (
        (SELECT id FROM ref_data_domains WHERE code = 'questions_orales_sans_debat'),
        (SELECT id FROM param_legislatures WHERE number = 16),
        'https://data.assemblee-nationale.fr/static/openData/repository/16/questions/questions_orales_sans_debat/Questions_orales_sans_debat.json.zip',
        'Questions_orales_sans_debat.json.zip'
    ),
    (
        (SELECT id FROM ref_data_domains WHERE code = 'questions_ecrites'),
        (SELECT id FROM param_legislatures WHERE number = 16),
        'https://data.assemblee-nationale.fr/static/openData/repository/16/questions/questions_ecrites/Questions_ecrites.json.zip',
        'Questions_ecrites.json.zip'
    ),
    (
        (SELECT id FROM ref_data_domains WHERE code = 'debats'),
        (SELECT id FROM param_legislatures WHERE number = 16),
        'https://data.assemblee-nationale.fr/static/openData/repository/16/vp/syceronbrut/syseron.xml.zip',
        'syseron.xml.zip'
    )
ON CONFLICT DO NOTHING;

-- ============================================
-- SOURCES DE DONNÉES - Législature 17
-- ============================================

INSERT INTO param_data_sources (domain_id, legislature_id, download_url, file_name)
VALUES
    (
        (SELECT id FROM ref_data_domains WHERE code = 'acteurs'),
        (SELECT id FROM param_legislatures WHERE number = 17),
        'https://data.assemblee-nationale.fr/static/openData/repository/17/amo/deputes_senateurs_ministres_legislature/AMO20_dep_sen_min_tous_mandats_et_organes.json.zip',
        'AMO20_dep_sen_min_tous_mandats_et_organes.json.zip'
    ),
    (
        (SELECT id FROM ref_data_domains WHERE code = 'scrutins'),
        (SELECT id FROM param_legislatures WHERE number = 17),
        'https://data.assemblee-nationale.fr/static/openData/repository/17/loi/scrutins/Scrutins.json.zip',
        'Scrutins.json.zip'
    ),
    (
        (SELECT id FROM ref_data_domains WHERE code = 'amendements'),
        (SELECT id FROM param_legislatures WHERE number = 17),
        'https://data.assemblee-nationale.fr/static/openData/repository/17/loi/amendements_div_legis/Amendements.json.zip',
        'Amendements.json.zip'
    ),
    (
        (SELECT id FROM ref_data_domains WHERE code = 'dossiers_legislatifs'),
        (SELECT id FROM param_legislatures WHERE number = 17),
        'https://data.assemblee-nationale.fr/static/openData/repository/17/loi/dossiers_legislatifs/Dossiers_Legislatifs.json.zip',
        'Dossiers_Legislatifs.json.zip'
    ),
    (
        (SELECT id FROM ref_data_domains WHERE code = 'reunions'),
        (SELECT id FROM param_legislatures WHERE number = 17),
        'https://data.assemblee-nationale.fr/static/openData/repository/17/vp/reunions/Agenda.json.zip',
        'Agenda.json.zip'
    ),
    (
        (SELECT id FROM ref_data_domains WHERE code = 'questions_gouvernement'),
        (SELECT id FROM param_legislatures WHERE number = 17),
        'https://data.assemblee-nationale.fr/static/openData/repository/17/questions/questions_gouvernement/Questions_gouvernement.json.zip',
        'Questions_gouvernement.json.zip'
    ),
    (
        (SELECT id FROM ref_data_domains WHERE code = 'questions_orales_sans_debat'),
        (SELECT id FROM param_legislatures WHERE number = 17),
        'https://data.assemblee-nationale.fr/static/openData/repository/17/questions/questions_orales_sans_debat/Questions_orales_sans_debat.json.zip',
        'Questions_orales_sans_debat.json.zip'
    ),
    (
        (SELECT id FROM ref_data_domains WHERE code = 'questions_ecrites'),
        (SELECT id FROM param_legislatures WHERE number = 17),
        'https://data.assemblee-nationale.fr/static/openData/repository/17/questions/questions_ecrites/Questions_ecrites.json.zip',
        'Questions_ecrites.json.zip'
    ),
    (
        (SELECT id FROM ref_data_domains WHERE code = 'debats'),
        (SELECT id FROM param_legislatures WHERE number = 17),
        'https://data.assemblee-nationale.fr/static/openData/repository/17/vp/syceronbrut/syseron.xml.zip',
        'syseron.xml.zip'
    )
ON CONFLICT DO NOTHING;

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Compteurs pour validation
SELECT 'param_legislatures', COUNT(*) FROM param_legislatures
UNION ALL
SELECT 'param_current_legislatures', COUNT(*) FROM param_current_legislatures
UNION ALL
SELECT 'ref_data_domains', COUNT(*) FROM ref_data_domains
UNION ALL
SELECT 'param_data_sources', COUNT(*) FROM param_data_sources;