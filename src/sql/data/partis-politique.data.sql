INSERT INTO ref_partis_politiques (groupe_id, libelle, code)
SELECT * FROM (VALUES
                   ('PO800484', 'Démocrate (MoDem et Indépendants)', 'MODEM'),
                   ('PO800526', 'Écologiste - NUPES', 'ECOLO'),
                   ('PO800502', 'Gauche démocrate et républicaine - NUPES', 'GDR-NUPES'),
                   ('PO800514', 'Horizons et apparentés', 'HOR'),
                   ('PO800490', 'La France insoumise - NUPES', 'LFI-NUPES'),
                   ('PO800508', 'Les Républicains', 'LR'),
                   ('PO800532', 'Libertés, Indépendants, Outre-mer et Territoires', 'LIOT'),
                   ('PO800520', 'Rassemblement National', 'RN'),
                   ('PO800538', 'Renaissance', 'RE'),
                   ('PO800496', 'Socialistes et apparentés - NUPES', 'SOC-NUPES'),
                   ('PO830170', 'Socialistes et apparentés', 'SOC'),
                   ('PO793087', 'Non inscrits', 'NI-16'),
                   ('PO845454', 'Les Démocrates', 'DEM'),
                   ('PO845439', 'Écologiste et Social', 'ECOS'),
                   ('PO845514', 'Gauche Démocrate et Républicaine', 'GDR'),
                   ('PO845470', 'Horizons & Indépendants', 'HOR'),
                   ('PO845413', 'La France insoumise - NFP', 'LFI-NFP'),
                   ('PO845407', 'Ensemble pour la République', 'EPR'),
                   ('PO845425', 'Droite Républicaine', 'DR'),
                   ('PO845485', 'Libertés, Indépendants, Outre-mer et Territoires', 'LIOT'),
                   ('PO845401', 'Rassemblement National', 'RN'),
                   ('PO845419', 'Socialistes et apparentés', 'SOC-17'),
                   ('PO847173', 'Union des droites pour la République', 'UDR'),
                   ('PO872880', 'Union des droites pour la République', 'UDR-2'),
                   ('PO840056', 'Non inscrits', 'NI-17'),
                   ('PO0',      'Non inscrits (groupe technique)', 'NI')
              ) AS v(groupe_id, libelle, code)
WHERE NOT EXISTS (
    SELECT 1 FROM ref_partis_politiques
    WHERE ref_partis_politiques.code = v.code
);