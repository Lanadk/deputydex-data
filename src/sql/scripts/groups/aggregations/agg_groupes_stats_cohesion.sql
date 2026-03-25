-- ============================================================
-- VIEW : agg_groupes_cohesion
-- ============================================================
-- Cohésion interne des groupes parlementaires
--
-- Logique :
--   - Comparaison entre :
--       * le vote individuel du député
--       * la position majoritaire du groupe sur le scrutin
--   - Mesure du taux d'alignement des membres du groupe
--   - Exclusion des scrutins sans position majoritaire définie
--
-- Colonnes :
--   - groupe_id           : identifiant technique du groupe
--   - libelle             : nom du groupe (référentiel)
--   - code                : code court du groupe
--   - legislature         : législature du groupe
--   - nb_votes_eligibles  : nombre de votes comparables (avec position majoritaire)
--   - nb_votes_alignes    : nombre de votes alignés avec le groupe
--   - taux_cohesion       : % d'alignement interne du groupe
-- ============================================================

CREATE MATERIALIZED VIEW agg_groupes_stats_cohesion AS
SELECT vd.groupe_id,
       rg.libelle,
       rg.code,
       vd.groupe_legislature                                                                                 AS legislature,
       COUNT(*) FILTER (WHERE sg.position_majoritaire IS NOT NULL)                                           AS nb_votes_eligibles,
       COUNT(*) FILTER (WHERE sg.position_majoritaire IS NOT NULL AND vd.position = sg.position_majoritaire) AS nb_votes_alignes,
       ROUND(COUNT(*) FILTER (WHERE sg.position_majoritaire IS NOT NULL AND vd.position = sg.position_majoritaire)::numeric
                 / NULLIF(COUNT(*) FILTER (WHERE sg.position_majoritaire IS NOT NULL), 0) * 100, 2) AS taux_cohesion
FROM votes_deputes vd
         INNER JOIN scrutins_groupes sg
                    ON sg.scrutin_uid = vd.scrutin_uid
                        AND sg.groupe_id = vd.groupe_id
         LEFT JOIN ref_groupes rg
                   ON rg.groupe_id = vd.groupe_id
WHERE vd.groupe_id IS NOT NULL
GROUP BY vd.groupe_id, rg.libelle, rg.code, vd.groupe_legislature;

CREATE UNIQUE INDEX ON agg_groupes_stats_cohesion(groupe_id, legislature);