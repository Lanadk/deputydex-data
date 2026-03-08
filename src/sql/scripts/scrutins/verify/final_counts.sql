SELECT 'deputes' AS table_name, COUNT(*) AS count
FROM deputes
UNION ALL
SELECT 'groupes_parlementaires', COUNT(*)
FROM groupes_parlementaires
UNION ALL
SELECT 'scrutins', COUNT(*)
FROM scrutins
UNION ALL
SELECT 'scrutins_groupes', COUNT(*)
FROM scrutins_groupes
UNION ALL
SELECT 'votes_deputes', COUNT(*)
FROM votes_deputes
UNION ALL
SELECT 'scrutins_agregats', COUNT(*)
FROM scrutins_agregats
UNION ALL
SELECT 'scrutins_groupes_agregats', COUNT(*)
FROM scrutins_groupes_agregats;