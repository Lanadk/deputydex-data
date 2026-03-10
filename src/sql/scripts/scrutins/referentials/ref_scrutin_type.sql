-- ref_scrutin_type issue de la table scrutins
INSERT INTO ref_scrutin_type (type_scrutin_code, type_scrutin_libelle)
SELECT DISTINCT type_scrutin_code, type_scrutin_libelle
FROM scrutins
ON CONFLICT DO NOTHING;