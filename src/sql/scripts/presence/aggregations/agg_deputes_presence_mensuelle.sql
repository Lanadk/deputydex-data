-- ============================================================
-- VIEW : agg_deputes_presence_mensuelle
-- ============================================================
-- Taux de présence d'un député, mois par mois (graphique d'évolution
-- de la fiche député). Mêmes indicateurs que agg_deputes_presence,
-- par mois civil ; règles dans mv_deputes_presence_jour.
--
-- Un mois sans jour attendu (vacances parlementaires) n'a pas de
-- ligne, ou une ligne avec taux_presence null.
--
-- Clé : (legislature, acteur_uid, mois) ; mois = 1er jour du mois.
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS agg_deputes_presence_mensuelle AS
SELECT
    legislature,
    acteur_uid,
    date_trunc('month', jour)::date                                                         AS mois,
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
GROUP BY legislature, acteur_uid, date_trunc('month', jour);

CREATE UNIQUE INDEX IF NOT EXISTS agg_deputes_presence_mensuelle_uq ON agg_deputes_presence_mensuelle (legislature, acteur_uid, mois);
