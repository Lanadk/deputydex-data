-- ============================================================
-- VIEW : agg_groupes_votes_positions
-- ============================================================
-- Répartition des positions de vote par groupe parlementaire
--
-- Logique :
--   - Agrégation des votes individuels des députés
--   - Calcul du volume total de votes par groupe et législature
--   - Calcul du pourcentage de chaque position
--
-- Colonnes :
--   - groupe_id     : identifiant technique du groupe
--   - libelle       : nom du groupe (référentiel)
--   - code          : code court du groupe
--   - legislature   : législature du groupe
--   - position      : position de vote (pour, contre, abstention, non_votant)
--   - nb_votes      : nombre de votes pour cette position
--   - total_votes   : total des votes du groupe
--   - pourcentage   : part (%) de cette position dans les votes du groupe
-- ============================================================

CREATE MATERIALIZED VIEW agg_groupes_stats_votes_positions AS
SELECT
    vd.groupe_id,
    rg.libelle,
    rg.code,
    vd.groupe_legislature AS legislature,
    vd.position,
    COUNT(*) AS nb_votes,
    SUM(COUNT(*)) OVER (
        PARTITION BY vd.groupe_id, vd.groupe_legislature
        ) AS total_votes,
    ROUND(
            COUNT(*)::numeric * 100
                / SUM(COUNT(*)) OVER (
                PARTITION BY vd.groupe_id, vd.groupe_legislature
                ),
            2
    ) AS pourcentage
FROM votes_deputes vd
         LEFT JOIN ref_groupes rg
                   ON rg.groupe_id = vd.groupe_id
WHERE vd.groupe_id IS NOT NULL
GROUP BY vd.groupe_id, rg.libelle, rg.code, vd.groupe_legislature, vd.position;

CREATE UNIQUE INDEX ON agg_groupes_stats_votes_positions(groupe_id, legislature, position);