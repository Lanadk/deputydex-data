-- ============================================================
-- VIEW : mv_scrutins_jours
-- ============================================================
-- Nombre de scrutins publics par jour : dénominateur de la
-- participation aux scrutins d'un député sur ses jours de mandat
-- (voir mv_deputes_presence_jour, domaine presence).
--
-- Colonnes :
--   - legislature : législature (legislature_snapshot)
--   - jour        : date du scrutin
--   - scrutins    : nombre de scrutins publics ce jour-là
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_scrutins_jours AS
SELECT
    s.legislature_snapshot AS legislature,
    s.date_scrutin         AS jour,
    COUNT(*)::int          AS scrutins
FROM scrutins s
WHERE s.date_scrutin IS NOT NULL
GROUP BY 1, 2;

CREATE UNIQUE INDEX IF NOT EXISTS mv_scrutins_jours_uq ON mv_scrutins_jours (legislature, jour);
