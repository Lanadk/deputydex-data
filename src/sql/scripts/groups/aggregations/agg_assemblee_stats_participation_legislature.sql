-- ============================================================
-- VIEW : agg_assemblee_stats_participation_legislature
-- ============================================================

CREATE MATERIALIZED VIEW agg_assemblee_stats_participation_legislature AS
SELECT
    legislature,
    ROUND(AVG(taux_participation_legislature), 2) AS taux_participation_moyen_assemblee
FROM agg_groupes_stats_participation_legislature
GROUP BY legislature;

CREATE UNIQUE INDEX ON agg_assemblee_stats_participation_legislature (legislature);