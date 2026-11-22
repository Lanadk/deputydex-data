-- ==============================================================================
-- VERIFY FINAL COUNT REF TABLES
-- Vérifie que les tables de référence sont bien peuplées
-- ==============================================================================

SELECT 'ref_scrutin_type' AS table_name, COUNT(*) AS total FROM ref_scrutin_type
UNION ALL
SELECT 'ref_organe_type', COUNT(*) FROM ref_organe_type
UNION ALL
SELECT 'ref_groupes', COUNT(*) FROM ref_groupes
UNION ALL
SELECT 'ref_groupes_fondation', COUNT(*) FROM ref_groupes_fondation
UNION ALL
SELECT 'ref_acteurs_photos', COUNT(*) FROM ref_acteurs_photos
UNION ALL
SELECT 'ref_portraits', COUNT(*) FROM ref_portraits
UNION ALL
SELECT 'ref_mandats_presidentiels', COUNT(*) FROM ref_mandats_presidentiels
UNION ALL
SELECT 'ref_evenements_institutionnels', COUNT(*) FROM ref_evenements_institutionnels
UNION ALL
SELECT 'ref_fonctions_definitions', COUNT(*) FROM ref_fonctions_definitions
ORDER BY table_name;