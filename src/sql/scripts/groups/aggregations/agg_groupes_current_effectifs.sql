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

CREATE MATERIALIZED VIEW agg_groupes_stats_cohesion AS
SELECT vd.groupe_id,
       vd.groupe_legislature AS legislature,
       rg.code,
       rg.libelle,
       COUNT(DISTINCT vd.scrutin_uid) FILTER (
           WHERE sg.position_majoritaire IN ('pour', 'contre', 'abstention')
               AND vd.position IN ('pour', 'contre', 'abstention')
           )                 AS nb_scrutins_couverts,
       COUNT(*) FILTER (
           WHERE sg.position_majoritaire IN ('pour', 'contre', 'abstention')
               AND vd.position IN ('pour', 'contre', 'abstention')
           )                 AS nb_votes_eligibles,
       COUNT(*) FILTER (
           WHERE sg.position_majoritaire IN ('pour', 'contre', 'abstention')
               AND vd.position = sg.position_majoritaire
           )                 AS nb_votes_alignes,
       ROUND(
                       COUNT(*) FILTER (
                   WHERE sg.position_majoritaire IN ('pour', 'contre', 'abstention')
                       AND vd.position = sg.position_majoritaire
                   )::numeric
                   / NULLIF(
                                       COUNT(*) FILTER (
                                   WHERE sg.position_majoritaire IN ('pour', 'contre', 'abstention')
                                       AND vd.position IN ('pour', 'contre', 'abstention')
                                   ),
                                       0
                     ) * 100,
                       2
       )                     AS taux_cohesion_politique
FROM votes_deputes vd
         INNER JOIN scrutins_groupes sg
                    ON sg.scrutin_uid = vd.scrutin_uid
                        AND sg.groupe_id = vd.groupe_id
                        AND sg.groupe_legislature = vd.groupe_legislature
         LEFT JOIN ref_groupes rg
                   ON rg.groupe_id = vd.groupe_id
                       AND rg.groupe_legislature = vd.groupe_legislature
WHERE vd.groupe_id IS NOT NULL
GROUP BY vd.groupe_id,
         vd.groupe_legislature,
         rg.code,
         rg.libelle;

CREATE UNIQUE INDEX ON agg_groupes_stats_cohesion (groupe_id, legislature);