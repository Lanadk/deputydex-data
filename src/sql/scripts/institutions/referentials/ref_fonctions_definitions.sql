-- ref_fonctions_definitions : référentiel manuel — définition courte de chaque
-- fonction présentée dans les organigrammes du front (Assemblée, exécutif).
-- Texte de vulgarisation, une ou deux phrases ; "source" : texte de référence.
--
-- "slug" est la clé lue par le front :
--   assemblee-*            : fonctions à l'Assemblée nationale (Bureau, groupes, commissions) ;
--   president-republique, premier-ministre ;
--   ministre-etat | ministre | ministre-delegue | secretaire-etat : rangs du gouvernement.
-- Sources : Constitution du 4 octobre 1958, Règlement de l'Assemblée nationale.

INSERT INTO ref_fonctions_definitions (slug, libelle, definition, source)
VALUES
    ('assemblee-president', 'Présidence de l''Assemblée nationale',
     'Élu par les députés pour toute la durée de la législature, le président dirige les débats en séance, préside le Bureau et la Conférence des présidents, et représente l''Assemblée. Il nomme trois membres du Conseil constitutionnel et est consulté par le Président de la République avant toute dissolution.',
     'Constitution, art. 12, 32 et 56 ; Règlement de l''Assemblée nationale'),
    ('assemblee-vice-president', 'Vice-présidence',
     'Les six vice-présidents suppléent le président de l''Assemblée : ils président à tour de rôle les séances publiques. Membres du Bureau, ils sont élus en début de législature puis renouvelés chaque année.',
     'Règlement de l''Assemblée nationale, art. 10'),
    ('assemblee-questeur', 'Questure',
     'Les trois questeurs, membres du Bureau, gèrent le budget et les services administratifs et financiers de l''Assemblée : aucune dépense nouvelle ne peut être engagée sans leur avis. Par tradition, l''un d''eux appartient à l''opposition.',
     'Règlement de l''Assemblée nationale, art. 15'),
    ('assemblee-secretaire', 'Secrétariat du Bureau',
     'Les douze secrétaires, membres du Bureau, assistent le président en séance : ils contrôlent les votes à main levée ou par assis et levé, le dépouillement des scrutins et les délégations de vote.',
     'Règlement de l''Assemblée nationale, art. 10'),
    ('assemblee-president-groupe', 'Présidence de groupe',
     'Le président d''un groupe politique (au moins quinze députés) parle au nom de son groupe et siège à la Conférence des présidents, qui organise l''ordre du jour de l''Assemblée.',
     'Règlement de l''Assemblée nationale, art. 19 et 47'),
    ('assemblee-president-commission', 'Présidence de commission permanente',
     'Le président d''une des huit commissions permanentes en dirige les travaux : examen des textes avant la séance, auditions, contrôle du Gouvernement. Il siège à la Conférence des présidents. La commission des finances est présidée par un député de l''opposition.',
     'Constitution, art. 43 ; Règlement de l''Assemblée nationale, art. 36 et 39'),
    ('president-republique', 'Président de la République',
     'Élu au suffrage universel direct pour cinq ans, le chef de l''État veille au respect de la Constitution, nomme le Premier ministre, préside le Conseil des ministres, promulgue les lois et peut dissoudre l''Assemblée nationale.',
     'Constitution, art. 5, 6, 8, 9, 10 et 12'),
    ('premier-ministre', 'Premier ministre',
     'Nommé par le Président de la République, le Premier ministre dirige l''action du Gouvernement, qui est responsable devant l''Assemblée nationale : celle-ci peut le renverser par une motion de censure.',
     'Constitution, art. 8, 20, 21 et 49'),
    ('ministre-etat', 'Ministre d''État',
     'Titre honorifique accordé à certains ministres : il marque leur importance politique et leur donne la préséance au sein du Gouvernement, sans pouvoirs supplémentaires.',
     NULL),
    ('ministre', 'Ministre',
     'Membre du Gouvernement à la tête d''un ministère : il en dirige l''administration, prépare les textes de son domaine et siège au Conseil des ministres.',
     'Constitution, art. 20'),
    ('ministre-delegue', 'Ministre délégué',
     'Membre du Gouvernement placé auprès du Premier ministre ou d''un ministre, chargé d''une partie de ses attributions, qu''il exerce par délégation.',
     NULL),
    ('secretaire-etat', 'Secrétaire d''État',
     'Rang le moins élevé du Gouvernement : placé auprès du Premier ministre ou d''un ministre, il est chargé d''un domaine précis et ne participe au Conseil des ministres que pour les affaires qui le concernent.',
     NULL)
ON CONFLICT (slug) DO UPDATE
    SET libelle    = EXCLUDED.libelle,
        definition = EXCLUDED.definition,
        source     = EXCLUDED.source,
        updated_at = now();
