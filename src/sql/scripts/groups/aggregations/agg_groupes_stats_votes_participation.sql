-- ============================================================
-- VIEW : agg_groupes_stats_votes_participation
-- ============================================================
-- Participation des groupes parlementaires aux scrutins
--
-- Ratio basé sur les positions
-- Logique :
--   - Agrégation des positions de vote par groupe à partir des
--     agrégats de scrutin par groupe
--   - Distinction entre :
--       * participation politique : pour, contre, abstention
--       * non participation : non_votants, non_votants_volontaires
--   - Calcul d'un taux global de participation
--   - Seuls les scrutins disposant d'un agrégat exploitable sont comptés
--
-- Colonnes :
--   - groupe_id                   : identifiant technique du groupe
--   - legislature                 : législature du groupe
--   - code                        : code court du groupe
--   - libelle                     : nom du groupe
--   - nb_scrutins                 : nombre de scrutins agrégés pour le groupe
--   - nb_positions_participantes  : total des positions pour/contre/abstention
--   - nb_non_votants              : total des non votants
--   - total_positions             : total de toutes les positions de vote
--   - taux_participation          : % de participation politique
-- ============================================================

CREATE MATERIALIZED VIEW agg_groupes_stats_votes_participation AS
WITH scrutins_legislature AS (SELECT s.legislature_snapshot AS legislature,
                                     COUNT(*)               AS nb_scrutins_legislature
                              FROM scrutins s
                              GROUP BY s.legislature_snapshot)
SELECT sg.groupe_id,
       sg.groupe_legislature           AS legislature,
       rg.code,
       rg.libelle,

       -- couverture
       COUNT(DISTINCT sga.scrutin_uid) AS nb_scrutins,

       sl.nb_scrutins_legislature,

       ROUND(
               COUNT(DISTINCT sga.scrutin_uid)::numeric
                   / NULLIF(sl.nb_scrutins_legislature, 0) * 100,
               2
       )                               AS taux_couverture_scrutins,

       -- participation
       SUM(
               COALESCE(sga.pour, 0)
                   + COALESCE(sga.contre, 0)
                   + COALESCE(sga.abstentions, 0)
       )                               AS nb_positions_participantes,

       SUM(
               COALESCE(sga.non_votants, 0)
                   + COALESCE(sga.non_votants_volontaires, 0)
       )                               AS nb_non_votants,

       SUM(
               COALESCE(sga.pour, 0)
                   + COALESCE(sga.contre, 0)
                   + COALESCE(sga.abstentions, 0)
                   + COALESCE(sga.non_votants, 0)
                   + COALESCE(sga.non_votants_volontaires, 0)
       )                               AS total_positions,

       ROUND(
               SUM(
                       COALESCE(sga.pour, 0)
                           + COALESCE(sga.contre, 0)
                           + COALESCE(sga.abstentions, 0)
               )::numeric
                   / NULLIF(
                       SUM(
                               COALESCE(sga.pour, 0)
                                   + COALESCE(sga.contre, 0)
                                   + COALESCE(sga.abstentions, 0)
                                   + COALESCE(sga.non_votants, 0)
                                   + COALESCE(sga.non_votants_volontaires, 0)
                       ),
                       0
                     ) * 100,
               2
       )                               AS taux_participation

FROM scrutins_groupes sg

         LEFT JOIN scrutins_groupes_agregats sga
                   ON sga.scrutin_uid = sg.scrutin_uid
                       AND sga.groupe_id = sg.groupe_id
                       AND sga.groupe_legislature = sg.groupe_legislature

         LEFT JOIN ref_groupes rg
                   ON rg.groupe_id = sg.groupe_id
                       AND rg.groupe_legislature = sg.groupe_legislature

         LEFT JOIN scrutins_legislature sl
                   ON sl.legislature = sg.groupe_legislature

GROUP BY sg.groupe_id,
         sg.groupe_legislature,
         rg.code,
         rg.libelle,
         sl.nb_scrutins_legislature;

CREATE UNIQUE INDEX ON agg_groupes_stats_votes_participation (groupe_id, legislature);