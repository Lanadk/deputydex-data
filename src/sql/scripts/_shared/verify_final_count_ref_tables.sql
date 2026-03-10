-- ==============================================================================
-- VERIFY FINAL COUNT REF TABLES
-- Vérifie que les tables de référence sont bien peuplées
-- ==============================================================================

SELECT 'ref_scrutin_type' AS table_name, COUNT(*) AS total FROM ref_scrutin_type
UNION ALL
SELECT 'ref_organe_type'  AS table_name, COUNT(*) AS total FROM ref_organe_type
ORDER BY table_name;