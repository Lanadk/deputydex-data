-- ============================================================
-- VIEW : agg_groupes_stats_cohesion
-- ============================================================
-- Cohésion politique interne des groupes parlementaires
--
-- Logique :
--   - Comparaison entre :
--       * le vote individuel du député
--       * la position majoritaire politique du groupe sur le scrutin
--   - Sont pris en compte uniquement les votes politiques explicites :
--       * pour
--       * contre
--       * abstention
--   - Exclusion :
--       * des scrutins sans position majoritaire définie
--       * des votes individuels non politiques (non-votant, etc.)
--
-- Colonnes :
--   - groupe_id           : identifiant technique du groupe
--   - legislature         : législature du groupe
--   - code                : code court du groupe
--   - libelle             : nom du groupe
--   - nb_votes_eligibles  : nombre de votes individuels comparables
--   - nb_votes_alignes    : nombre de votes alignés avec la majorité du groupe
--   - taux_cohesion_politique : % d'alignement politique interne
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
       m.groupe_legislature         AS legislature,
       rg.libelle,
       rg.code,
       COUNT(DISTINCT m.acteur_uid) AS nb_acteurs
FROM members_at_ref_date m
         LEFT JOIN ref_groupes rg
                   ON rg.groupe_id = m.groupe_id
GROUP BY m.groupe_id,
         m.groupe_legislature,
         rg.libelle,
         rg.code;

CREATE UNIQUE INDEX ON agg_groupes_stats_cohesion (groupe_id, legislature);