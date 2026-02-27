SELECT table_name, count
FROM (SELECT 'mandats' AS table_name, COUNT(*) AS count
      FROM mandats
      UNION ALL
      SELECT 'mandats_suppleants', COUNT (*)
      FROM mandats_suppleants) counts
ORDER BY table_name;