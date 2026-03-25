CREATE MATERIALIZED VIEW agg_groupes_legislature_effectifs AS
WITH legislatures_ref AS (SELECT pl.number AS legislature,
                                 CASE
                                     WHEN pl.number IN (SELECT number FROM param_current_legislatures)
                                         THEN CURRENT_DATE
                                     ELSE pl.end_date
                                     END   AS date_reference
                          FROM param_legislatures pl),
     effectifs_photo AS (SELECT ag.groupe_id,
                                ag.groupe_legislature         AS legislature,
                                COUNT(DISTINCT ag.acteur_uid) AS nb_acteurs_photo
                         FROM acteurs_groupes ag
                                  INNER JOIN legislatures_ref lr
                                             ON lr.legislature = ag.groupe_legislature
                         WHERE lr.date_reference IS NOT NULL
                           AND ag.date_debut <= lr.date_reference
                           AND (ag.date_fin IS NULL OR ag.date_fin >= lr.date_reference)
                         GROUP BY ag.groupe_id,
                                  ag.groupe_legislature),
     effectifs_historiques AS (SELECT ag.groupe_id,
                                      ag.groupe_legislature         AS legislature,
                                      COUNT(DISTINCT ag.acteur_uid) AS nb_acteurs_distincts_legislature
                               FROM acteurs_groupes ag
                               GROUP BY ag.groupe_id,
                                        ag.groupe_legislature)
SELECT rg.groupe_id,
       rg.groupe_legislature                            AS legislature,
       rg.code,
       rg.libelle,
       COALESCE(ep.nb_acteurs_photo, 0)                 AS nb_acteurs_photo,
       COALESCE(eh.nb_acteurs_distincts_legislature, 0) AS nb_acteurs_distincts_legislature
FROM ref_groupes rg
         LEFT JOIN effectifs_photo ep
                   ON ep.groupe_id = rg.groupe_id
                       AND ep.legislature = rg.groupe_legislature
         LEFT JOIN effectifs_historiques eh
                   ON eh.groupe_id = rg.groupe_id
                       AND eh.legislature = rg.groupe_legislature;

CREATE UNIQUE INDEX ON agg_groupes_legislature_effectifs (groupe_id, legislature);