SELECT 'reunions' AS table_name, COUNT(*)
FROM reunions
UNION ALL
SELECT 'reunions_participants', COUNT(*)
FROM reunions_participants
UNION ALL
SELECT 'reunions_points_odj', COUNT(*)
FROM reunions_points_odj
UNION ALL
SELECT 'reunions_points_odj_dossiers', COUNT(*)
FROM reunions_points_odj_dossiers;
