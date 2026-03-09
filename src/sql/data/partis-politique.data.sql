INSERT INTO ref_partis_politiques (groupe_id, groupe_legislature, libelle, code)
SELECT * FROM (VALUES
                   ('PO800484', 16, 'Démocrate (MoDem et Indépendants)', 'DEM'),
                   ('PO800526', 16, 'Écologiste - NUPES', 'ECOLO-NUPES'),
                   ('PO800502', 16, 'Gauche démocrate et républicaine - NUPES', 'GDR-NUPES'),
                   ('PO800514', 16, 'Horizons et apparentés', 'HOR'),
                   ('PO800490', 16, 'La France insoumise - NUPES', 'LFI-NUPES'),
                   ('PO800508', 16, 'Les Républicains', 'LR'),
                   ('PO800532', 16, 'Libertés, Indépendants, Outre-mer et Territoires', 'LIOT'),
                   ('PO800520', 16, 'Rassemblement National', 'RN'),
                   ('PO800538', 16, 'Renaissance', 'RE'),
                   ('PO800496', 16, 'Socialistes et apparentés - NUPES', 'SOC-NUPES'),
                   ('PO830170', 16, 'Socialistes et apparentés', 'SOC'),
                   ('PO793087', 16, 'Non inscrits', 'NI-16'),
                   ('PO845454', 17, 'Les Démocrates', 'DEM'),
                   ('PO845439', 17, 'Écologiste et Social', 'ECOS'),
                   ('PO845514', 17, 'Gauche Démocrate et Républicaine', 'GDR'),
                   ('PO845470', 17, 'Horizons & Indépendants', 'HOR'),
                   ('PO845413', 17, 'La France insoumise - NFP', 'LFI-NFP'),
                   ('PO845407', 17, 'Ensemble pour la République', 'EPR'),
                   ('PO845425', 17, 'Droite Républicaine', 'DR'),
                   ('PO845485', 17, 'Libertés, Indépendants, Outre-mer et Territoires', 'LIOT'),
                   ('PO845401', 17, 'Rassemblement National', 'RN'),
                   ('PO845419', 17, 'Socialistes et apparentés', 'SOC'),
                   ('PO847173', 17, 'Union des droites pour la République', 'UDR'),
                   ('PO872880', 17, 'Union des droites pour la République', 'UDDPLR'),
                   ('PO840056', 17, 'Non inscrits', 'NI-17'),
                   ('PO0',      17, 'Non inscrits (groupe technique)', 'NI')
              ) AS v(groupe_id, groupe_legislature, libelle, code)
WHERE NOT EXISTS (
    SELECT 1 FROM ref_partis_politiques
    WHERE ref_partis_politiques.code = v.code
);