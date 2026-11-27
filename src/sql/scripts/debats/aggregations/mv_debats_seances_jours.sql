-- ============================================================
-- VIEW : mv_debats_seances_jours
-- ============================================================
-- Séances publiques réellement tenues : un jour par date où au moins
-- un compte rendu de séance a été publié. Brique « calendrier » de la
-- présence (voir mv_deputes_presence_jour, domaine presence).
--
-- Pourquoi les comptes rendus et pas l'agenda (reunions) : l'agenda
-- marque « Confirmé » des séances qui n'ont pas eu lieu (9 jours en
-- législature 17, ex. le 18 décembre 2024 après la censure du
-- gouvernement) et contient les séances à venir. Un compte rendu
-- prouve que la séance s'est tenue.
--
-- Colonnes :
--   - legislature    : législature de l'archive (legislature_snapshot)
--   - jour           : date de la séance (heure de Paris)
--   - comptes_rendus : nombre de séances ce jour-là (1 à 3)
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_debats_seances_jours AS
SELECT
    c.legislature_snapshot                            AS legislature,
    (c.date_seance AT TIME ZONE 'Europe/Paris')::date  AS jour,
    COUNT(*)::int                                     AS comptes_rendus
FROM debats_comptes_rendus c
WHERE c.date_seance IS NOT NULL
GROUP BY 1, 2;

CREATE UNIQUE INDEX IF NOT EXISTS mv_debats_seances_jours_uq ON mv_debats_seances_jours (legislature, jour);
