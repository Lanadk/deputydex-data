SELECT 'acteurs' AS table, COUNT(*)
FROM acteurs
UNION ALL
SELECT 'adresses_postales', COUNT(*)
FROM acteurs_adresses_postales
UNION ALL
SELECT 'adresses_mails', COUNT(*)
FROM acteurs_adresses_mails
UNION ALL
SELECT 'reseaux_sociaux', COUNT(*)
FROM acteurs_reseaux_sociaux
UNION ALL
SELECT 'telephones', COUNT(*)
FROM acteurs_telephones;