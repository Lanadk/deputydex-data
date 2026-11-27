-- ============================================================
-- VIEW : agg_deputes_presence_annuelle
-- ============================================================
-- Présence d'un député par année, selon trois découpages (colonne
-- type_periode). Mêmes indicateurs que agg_deputes_presence ; règles
-- dans mv_deputes_presence_jour.
--
-- Découpages :
--   - civile        : 1er janvier → 31 décembre ; periode = '2025'
--   - parlementaire : 1er octobre → 30 septembre (session ordinaire
--                     d'octobre à juin + sessions extraordinaires de
--                     juillet / septembre, comme l'AN) ; periode =
--                     '2025-2026'. Juillet–septembre 2024 (début de la
--                     17ᵉ législature) relève de '2023-2024'.
--   - mandat        : années successives depuis la première prise de
--                     fonction du député dans la législature (debut_mandat) ;
--                     periode = '1', '2'… Propre à chaque député : pas
--                     d'équivalent groupe / Assemblée.
--
-- Une période entamée ou incomplète (début ou fin de législature,
-- année en cours) a moins de mois_actifs : comparer les jours de
-- présence par mois (jours_presence_par_mois) plutôt que le total.
--
-- Clé : (legislature, acteur_uid, type_periode, periode).
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS agg_deputes_presence_annuelle AS
WITH jours AS (
    SELECT p.*, per.type_periode, per.periode, per.periode_debut, per.periode_fin
    FROM mv_deputes_presence_jour p
             CROSS JOIN LATERAL (
        VALUES
            ('civile',
             to_char(p.jour, 'YYYY'),
             date_trunc('year', p.jour)::date,
             (date_trunc('year', p.jour) + INTERVAL '1 year - 1 day')::date),
            ('parlementaire',
             to_char(date_trunc('year', p.jour - INTERVAL '9 months'), 'YYYY') || '-'
                 || to_char(date_trunc('year', p.jour - INTERVAL '9 months') + INTERVAL '1 year', 'YYYY'),
             (date_trunc('year', p.jour - INTERVAL '9 months') + INTERVAL '9 months')::date,
             (date_trunc('year', p.jour - INTERVAL '9 months') + INTERVAL '21 months - 1 day')::date),
            ('mandat',
             (EXTRACT(YEAR FROM age(p.jour, p.debut_mandat))::int + 1)::text,
             (p.debut_mandat + EXTRACT(YEAR FROM age(p.jour, p.debut_mandat))::int * INTERVAL '1 year')::date,
             (p.debut_mandat + (EXTRACT(YEAR FROM age(p.jour, p.debut_mandat))::int + 1) * INTERVAL '1 year'
                 - INTERVAL '1 day')::date)
        ) AS per(type_periode, periode, periode_debut, periode_fin)
)
SELECT
    legislature,
    acteur_uid,
    type_periode,
    periode,
    MIN(periode_debut)                                                                      AS periode_debut,
    MIN(periode_fin)                                                                        AS periode_fin,
    COUNT(*) FILTER (WHERE attendu)::int                                                    AS jours_attendus,
    COUNT(*) FILTER (WHERE attendu AND present)::int                                        AS jours_presents,
    ROUND(100.0 * COUNT(*) FILTER (WHERE attendu AND present)
              / NULLIF(COUNT(*) FILTER (WHERE attendu), 0), 1)                              AS taux_presence,
    COUNT(*) FILTER (WHERE seance_observable)::int                                          AS jours_seance,
    COUNT(*) FILTER (WHERE seance_observable AND present_seance)::int                       AS jours_seance_presents,
    ROUND(100.0 * COUNT(*) FILTER (WHERE seance_observable AND present_seance)
              / NULLIF(COUNT(*) FILTER (WHERE seance_observable), 0), 1)                    AS taux_presence_seance,
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
    COUNT(*) FILTER (WHERE present AND NOT attendu)::int                                    AS jours_presence_non_attendus,
    COUNT(*) FILTER (WHERE present)::int                                                    AS jours_presence,
    COUNT(*) FILTER (WHERE votes_personnels > 0)::int                                       AS jours_vote,
    COUNT(*) FILTER (WHERE prises_de_parole + interruptions + paroles_presidence > 0)::int  AS jours_debat,
    COUNT(*) FILTER (WHERE presences_commission + presences_hors_mandat > 0)::int           AS jours_commission,
    COUNT(DISTINCT date_trunc('month', jour)) FILTER (WHERE attendu OR jour_seance)::int     AS mois_actifs,
    ROUND(COUNT(*) FILTER (WHERE present)::numeric
              / NULLIF(COUNT(DISTINCT date_trunc('month', jour)) FILTER (WHERE attendu OR jour_seance), 0), 1) AS jours_presence_par_mois
FROM jours
GROUP BY legislature, acteur_uid, type_periode, periode;

CREATE UNIQUE INDEX IF NOT EXISTS agg_deputes_presence_annuelle_uq ON agg_deputes_presence_annuelle (legislature, acteur_uid, type_periode, periode);
