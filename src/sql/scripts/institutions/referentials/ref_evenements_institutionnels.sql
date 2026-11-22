-- ref_evenements_institutionnels : référentiel manuel — événements
-- institutionnels marquants autour des législatures couvertes (absents de
-- l'open data de l'AN), affichés sur la frise chronologique du front.
--
-- "type" : 'dissolution' | 'elections_legislatives' (date du second tour).
-- Sources : Journal officiel (décret de dissolution), ministère de l'Intérieur
-- (résultats des élections législatives).

INSERT INTO ref_evenements_institutionnels (date, type, libelle)
VALUES
    ('2022-06-19', 'elections_legislatives', 'Élections législatives (2d tour)'),
    ('2024-06-09', 'dissolution',            'Dissolution de l''Assemblée'),
    ('2024-07-07', 'elections_legislatives', 'Élections législatives anticipées (2d tour)')
ON CONFLICT (date, type) DO UPDATE
    SET libelle    = EXCLUDED.libelle,
        updated_at = now();
