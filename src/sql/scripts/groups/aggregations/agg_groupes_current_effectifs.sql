-- ============================================================
-- VIEW : agg_groupes_effectifs
-- ============================================================
-- Effectif actuel des groupes parlementaires
--
-- Logique :
--   - On considère uniquement les appartenances actives
--     (date_fin IS NULL dans acteurs_groupes)
--   - Un acteur ne compte qu'une seule fois par groupe
--
-- Colonnes :
--   - groupe_id    : identifiant technique du groupe
--   - libelle      : nom du groupe (référentiel)
--   - code         : code court du groupe
--   - legislature  : législature du groupe
--   - nb_acteurs   : nombre de députés actuellement dans le groupe
-- ============================================================

CREATE MATERIALIZED VIEW agg_groupes_current_effectifs AS
WITH legislatures_ref AS (SELECT pl.number AS legislature,
                                 CASE
                                     WHEN pl.number IN (SELECT number FROM param_current_legislatures)
                                         THEN CURRENT_DATE
                                     ELSE pl.end_date
                                     END   AS date_reference
                          FROM param_legislatures pl),
     members_at_ref_date AS (SELECT ag.groupe_id,
                                    ag.groupe_legislature,
                                    ag.acteur_uid
                             FROM acteurs_groupes ag
                                      INNER JOIN legislatures_ref lr
                                                 ON lr.legislature = ag.groupe_legislature
                             WHERE lr.date_reference IS NOT NULL
                               AND ag.date_debut <= lr.date_reference
                               AND (ag.date_fin IS NULL OR ag.date_fin >= lr.date_reference))
SELECT m.groupe_id,
       rg.libelle,
       rg.code,
       m.groupe_legislature         AS legislature,
       COUNT(DISTINCT m.acteur_uid) AS nb_acteurs
FROM members_at_ref_date m
         LEFT JOIN ref_groupes rg
                   ON rg.groupe_id = m.groupe_id
GROUP BY m.groupe_id, rg.libelle, rg.code, m.groupe_legislature;

CREATE UNIQUE INDEX ON agg_groupes_current_effectifs(groupe_id, legislature);