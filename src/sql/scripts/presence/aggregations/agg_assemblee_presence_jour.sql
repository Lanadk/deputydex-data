-- ============================================================
-- VIEW : agg_assemblee_presence_jour
-- ============================================================
-- Présence de toute l'Assemblée nationale, jour par jour (graphique
-- journalier de la page statistiques). Règles dans
-- mv_deputes_presence_jour.
--
-- Une ligne par jour où au moins un député est attendu ou présent.
--
-- Colonnes :
--   - legislature        : législature
--   - jour               : date
--   - jour_semaine       : 1 = lundi … 7 = dimanche (ISO)
--   - seance_observable  : séance avec au moins un scrutin public
--   - deputes_attendus   : députés attendus ce jour-là
--   - deputes_presents   : … et présents
--   - taux_presence      : deputes_presents / deputes_attendus
--   - deputes_en_seance  : députés présents en séance (vote personnel,
--                          parole, interruption, présidence)
--   - deputes_en_mandat  : députés en mandat un jour de séance
--                          observable (null sinon)
--   - taux_presence_seance : deputes_en_seance / deputes_en_mandat
--   - deputes_presents_total : députés présents, attendus ou non
--   - scrutins           : scrutins publics ce jour-là
--
-- Clé : (legislature, jour).
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS agg_assemblee_presence_jour AS
SELECT
    legislature,
    jour,
    EXTRACT(ISODOW FROM jour)::int                                                          AS jour_semaine,
    BOOL_OR(seance_observable)                                                              AS seance_observable,
    COUNT(*) FILTER (WHERE attendu)::int                                                    AS deputes_attendus,
    COUNT(*) FILTER (WHERE attendu AND present)::int                                        AS deputes_presents,
    ROUND(100.0 * COUNT(*) FILTER (WHERE attendu AND present)
              / NULLIF(COUNT(*) FILTER (WHERE attendu), 0), 1)                              AS taux_presence,
    COUNT(*) FILTER (WHERE seance_observable AND present_seance)::int                       AS deputes_en_seance,
    NULLIF(COUNT(*) FILTER (WHERE seance_observable), 0)::int                               AS deputes_en_mandat,
    ROUND(100.0 * COUNT(*) FILTER (WHERE seance_observable AND present_seance)
              / NULLIF(COUNT(*) FILTER (WHERE seance_observable), 0), 1)                    AS taux_presence_seance,
    COUNT(*) FILTER (WHERE present)::int                                                    AS deputes_presents_total,
    MAX(scrutins_jour)::int                                                                 AS scrutins
FROM mv_deputes_presence_jour
GROUP BY legislature, jour;

CREATE UNIQUE INDEX IF NOT EXISTS agg_assemblee_presence_jour_uq ON agg_assemblee_presence_jour (legislature, jour);
