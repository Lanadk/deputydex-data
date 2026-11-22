-- ref_mandats_presidentiels : référentiel manuel — mandats présidentiels de la
-- Ve République. Le Président n'apparaît pas dans l'open data de l'AN (il n'y
-- figure que s'il a été député, et sans mandat présidentiel).
--
-- Dates de début et de fin de MANDAT (et non d'investiture), source :
-- elysee.fr / Conseil constitutionnel (proclamation des résultats).
-- "fin" NULL = mandat en cours. À compléter à chaque élection présidentielle
-- (prochaine : 2027) : fermer le mandat en cours et en ajouter un.
-- "portrait_slug" : clé de ref_portraits (NULL : pas de portrait, le front
-- affiche les initiales). Seuls les mandats couvrant les législatures
-- présentes dans Députédex ont besoin d'un portrait.

INSERT INTO ref_mandats_presidentiels (president, mandat_numero, debut, fin, portrait_slug)
VALUES
    ('François Hollande', 1, '2012-05-15', '2017-05-14', NULL),
    ('Emmanuel Macron',   1, '2017-05-14', '2022-05-13', 'emmanuel-macron'),
    ('Emmanuel Macron',   2, '2022-05-14', NULL,         'emmanuel-macron')
ON CONFLICT (debut) DO UPDATE
    SET president     = EXCLUDED.president,
        mandat_numero = EXCLUDED.mandat_numero,
        fin           = EXCLUDED.fin,
        portrait_slug = EXCLUDED.portrait_slug,
        updated_at    = now();
