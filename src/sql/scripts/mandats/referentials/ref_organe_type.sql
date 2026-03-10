-- ref_organe_type issue des organes dans mandats
INSERT INTO ref_organe_type (type_organe)
SELECT DISTINCT mandats.type_organe
FROM mandats
ON CONFLICT DO NOTHING;