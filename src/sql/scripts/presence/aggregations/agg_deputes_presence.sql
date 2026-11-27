-- ============================================================
-- VIEW : agg_deputes_presence
-- ============================================================
-- Taux de présence d'un député sur la législature (KPI de la fiche
-- député). Calculé à partir de mv_deputes_presence_jour : voir ce
-- fichier pour les règles (jour attendu, jour présent, sources).
--
-- Indicateurs (mêmes colonnes dans toutes les vues agg_*_presence*) :
--   - jours_attendus / jours_presents / taux_presence : indicateur
--     principal, en jours (jours présents parmi les jours attendus)
--   - jours_seance / jours_seance_presents / taux_presence_seance :
--     présence en séance publique, les jours de séance observables
--     (avec au moins un scrutin public)
--   - convocations / presences_commission / excuses_commission /
--     absences_commission / taux_presence_commission /
--     taux_excuses_commission : réunions où il est membre de l'organe
--   - scrutins / votes_personnels / votes_par_delegation /
--     taux_participation_scrutins : votes personnels parmi les scrutins
--     publics de ses jours de mandat
--   - prises_de_parole / interruptions : volume d'activité en séance
--   - jours_presence_non_attendus : présences un jour où il n'était pas
--     attendu (ex. réunion d'un organe dont il n'est pas membre)
--
-- Clé : (legislature, acteur_uid).
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS agg_deputes_presence AS
SELECT
    legislature,
    acteur_uid,
    COUNT(*) FILTER (WHERE attendu)::int                                                    AS jours_attendus,
    COUNT(*) FILTER (WHERE attendu AND present)::int                                        AS jours_presents,
    ROUND(100.0 * COUNT(*) FILTER (WHERE attendu AND present)
              / NULLIF(COUNT(*) FILTER (WHERE attendu), 0), 1)                              AS taux_presence,
    COUNT(*) FILTER (WHERE seance_observable)::int                                                AS jours_seance,
    COUNT(*) FILTER (WHERE seance_observable AND present_seance)::int                             AS jours_seance_presents,
    ROUND(100.0 * COUNT(*) FILTER (WHERE seance_observable AND present_seance)
              / NULLIF(COUNT(*) FILTER (WHERE seance_observable), 0), 1)                          AS taux_presence_seance,
    SUM(convocations)::int                                                                  AS convocations,
    SUM(presences_commission)::int                                                          AS presences_commission,
    SUM(excuses_commission)::int                                                            AS excuses_commission,
    SUM(absences_commission)::int                                                           AS absences_commission,
    ROUND(100.0 * SUM(presences_commission) / NULLIF(SUM(convocations), 0), 1)              AS taux_presence_commission,
    ROUND(100.0 * SUM(excuses_commission) / NULLIF(SUM(convocations), 0), 1)                AS taux_excuses_commission,
    SUM(scrutins_jour)::int                                                                 AS scrutins,
    SUM(votes_personnels)::int                                                              AS votes_personnels,
    SUM(votes_par_delegation)::int                                                          AS votes_par_delegation,
    ROUND(100.0 * SUM(votes_personnels) / NULLIF(SUM(scrutins_jour), 0), 1)                 AS taux_participation_scrutins,
    SUM(prises_de_parole)::int                                                              AS prises_de_parole,
    SUM(interruptions)::int                                                                 AS interruptions,
    COUNT(*) FILTER (WHERE present AND NOT attendu)::int                                    AS jours_presence_non_attendus
FROM mv_deputes_presence_jour
GROUP BY legislature, acteur_uid;

CREATE UNIQUE INDEX IF NOT EXISTS agg_deputes_presence_uq ON agg_deputes_presence (legislature, acteur_uid);
