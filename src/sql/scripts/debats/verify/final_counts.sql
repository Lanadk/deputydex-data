SELECT 'debats_comptes_rendus' AS table_name, COUNT(*)
FROM debats_comptes_rendus
UNION ALL
SELECT 'debats_points', COUNT(*)
FROM debats_points
UNION ALL
SELECT 'debats_interventions', COUNT(*)
FROM debats_interventions
UNION ALL
SELECT 'debats_interventions_orateurs', COUNT(*)
FROM debats_interventions_orateurs;
