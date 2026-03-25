-- ============================================================
-- VIEW : agg_groupes_votes_participation
-- ============================================================
-- Participation des groupes parlementaires aux scrutins
--
-- Logique :
--   - Agrégation des résultats de vote par groupe (tables agrégées)
--   - Distinction entre :
--       * votes exprimés (pour, contre, abstention)
--       * non participation (non_votants, non_votants_volontaires)
--   - Calcul d'un taux de participation global
--
-- Colonnes :
--   - groupe_id                    : identifiant technique du groupe
--   - libelle                      : nom du groupe (référentiel)
--   - code                         : code court du groupe
--   - legislature                  : législature du groupe
--   - nb_scrutins                  : nombre de scrutins auxquels le groupe participe
--   - nb_exprimes_ou_abstentions   : total des votes exprimés ou abstentions
--   - nb_non_votants               : total des non votants
--   - total_positions              : total de toutes les positions de vote
--   - taux_participation           : % de participation (hors non votants)
-- ============================================================

CREATE MATERIALIZED VIEW agg_groupes_stats_votes_participation AS
SELECT sg.groupe_id,
       rg.libelle,
       rg.code,
       sg.groupe_legislature                                                        AS legislature,
       COUNT(DISTINCT sg.scrutin_uid)                                               AS nb_scrutins,
       SUM(COALESCE(sga.pour, 0) + COALESCE(sga.contre, 0) +
           COALESCE(sga.abstentions, 0))                                            AS nb_exprimes_ou_abstentions,
       SUM(COALESCE(sga.non_votants, 0) + COALESCE(sga.non_votants_volontaires, 0)) AS nb_non_votants,
       SUM(
               COALESCE(sga.pour, 0)
                   + COALESCE(sga.contre, 0)
                   + COALESCE(sga.abstentions, 0)
                   + COALESCE(sga.non_votants, 0)
                   + COALESCE(sga.non_votants_volontaires, 0)
       )                                                                            AS total_positions,
       ROUND(
               (
                   SUM(COALESCE(sga.pour, 0) + COALESCE(sga.contre, 0) + COALESCE(sga.abstentions, 0))::numeric
                       / NULLIF(
                           SUM(
                                   COALESCE(sga.pour, 0)
                                       + COALESCE(sga.contre, 0)
                                       + COALESCE(sga.abstentions, 0)
                                       + COALESCE(sga.non_votants, 0)
                                       + COALESCE(sga.non_votants_volontaires, 0)
                           ),
                           0
                         )
                   ) * 100,
               2
       )                                                                            AS taux_participation
FROM scrutins_groupes sg
         LEFT JOIN scrutins_groupes_agregats sga
                   ON sga.scrutin_uid = sg.scrutin_uid
                       AND sga.groupe_id = sg.groupe_id
         LEFT JOIN ref_groupes rg
                   ON rg.groupe_id = sg.groupe_id
GROUP BY sg.groupe_id, rg.libelle, rg.code, sg.groupe_legislature;

CREATE UNIQUE INDEX ON agg_groupes_stats_votes_participation(groupe_id, legislature);