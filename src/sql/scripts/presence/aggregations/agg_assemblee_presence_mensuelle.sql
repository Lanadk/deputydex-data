-- ============================================================
-- VIEW : agg_assemblee_presence_mensuelle
-- ============================================================
-- Taux de présence de toute l'Assemblée nationale, mois par mois
-- (graphique d'évolution de la page statistiques). Mêmes règles que
-- agg_assemblee_presence, par mois civil.
--
-- Clé : (legislature, mois) ; mois = 1er jour du mois.
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS agg_assemblee_presence_mensuelle AS
SELECT
    legislature,
    date_trunc('month', jour)::date                                                         AS mois,
    COUNT(DISTINCT acteur_uid)::int                                                         AS nb_deputes,
    -- Effectif moyen : députés en mandat par jour de séance observable, jours où tous sont
    -- attendus (nb_deputes compte tout député passé par le groupe, ex. tous les députés
    -- « non inscrits » avant la formation des groupes ; les jours de commission n'attendent
    -- que les membres de l'organe).
    ROUND(COUNT(*) FILTER (WHERE seance_observable)::numeric
              / NULLIF(COUNT(DISTINCT jour) FILTER (WHERE seance_observable), 0), 1)        AS effectif_moyen,
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
    SUM(scrutins_jour)::bigint                                                              AS scrutins,
    SUM(votes_personnels)::bigint                                                           AS votes_personnels,
    SUM(votes_par_delegation)::bigint                                                       AS votes_par_delegation,
    ROUND(100.0 * SUM(votes_personnels) / NULLIF(SUM(scrutins_jour), 0), 1)                 AS taux_participation_scrutins,
    SUM(prises_de_parole)::int                                                              AS prises_de_parole,
    SUM(interruptions)::int                                                                 AS interruptions,
    COUNT(*) FILTER (WHERE present AND NOT attendu)::int                                    AS jours_presence_non_attendus,
    -- Volume : jours de présence toutes sources confondues (attendus ou non), un jour
    -- compté une fois ; et jours avec au moins un vote personnel / une prise de parole
    -- (parole, interruption, présidence) / une présence en commission (se recoupent).
    COUNT(*) FILTER (WHERE present)::int                                                    AS jours_presence,
    COUNT(*) FILTER (WHERE votes_personnels > 0)::int                                       AS jours_vote,
    COUNT(*) FILTER (WHERE prises_de_parole + interruptions + paroles_presidence > 0)::int  AS jours_debat,
    COUNT(*) FILTER (WHERE presences_commission + presences_hors_mandat > 0)::int           AS jours_commission,
    -- Moyenne de jours de présence d'un député actif ce mois-ci.
    ROUND(COUNT(*) FILTER (WHERE present)::numeric
              / NULLIF(COUNT(DISTINCT acteur_uid) FILTER (WHERE attendu OR jour_seance), 0), 1)     AS jours_presence_par_depute
FROM mv_deputes_presence_jour
GROUP BY legislature, date_trunc('month', jour);

CREATE UNIQUE INDEX IF NOT EXISTS agg_assemblee_presence_mensuelle_uq ON agg_assemblee_presence_mensuelle (legislature, mois);
