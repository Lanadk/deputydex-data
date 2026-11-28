-- ============================================================
-- VIEW : agg_assemblee_presence_jour_semaine
-- ============================================================
-- Rythme de la semaine parlementaire : présence de toute l'Assemblée
-- par jour de la semaine, sur la législature (mardi / mercredi : votes
-- solennels et questions au Gouvernement ; lundi / vendredi :
-- circonscription). Agrège agg_assemblee_presence_jour.
--
-- Taux pondérés (somme des députés présents / somme des députés
-- attendus), séances observables et jours de commission confondus pour
-- taux_presence ; séances observables seules pour les colonnes *_seance.
--
-- Colonnes :
--   - legislature             : législature
--   - jour_semaine            : 1 = lundi … 7 = dimanche (ISO)
--   - jours                   : jours avec au moins un député attendu
--   - jours_seance            : dont séances observables
--   - taux_presence           : présence, tous jours attendus
--   - taux_presence_seance    : présence en séance, séances observables
--   - deputes_en_seance_moyen : députés présents en séance, en moyenne
--                               par séance observable
--
-- legislature IS NULL = toutes législatures confondues : agrège les
-- lignes « toutes législatures » de agg_assemblee_presence_jour (le
-- GROUP BY legislature les regroupe naturellement sous NULL), si bien
-- qu'un jour de passage d'une législature à l'autre compte une fois.
--
-- Clé : (legislature, jour_semaine) ; legislature NULL = toutes.
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS agg_assemblee_presence_jour_semaine AS
SELECT
    legislature,
    jour_semaine,
    COUNT(*) FILTER (WHERE deputes_attendus > 0)::int                                       AS jours,
    COUNT(*) FILTER (WHERE seance_observable)::int                                          AS jours_seance,
    ROUND(100.0 * SUM(deputes_presents) / NULLIF(SUM(deputes_attendus), 0), 1)              AS taux_presence,
    ROUND(100.0 * SUM(deputes_en_seance) FILTER (WHERE seance_observable)
              / NULLIF(SUM(deputes_en_mandat) FILTER (WHERE seance_observable), 0), 1)      AS taux_presence_seance,
    ROUND(AVG(deputes_en_seance) FILTER (WHERE seance_observable), 1)                       AS deputes_en_seance_moyen
FROM agg_assemblee_presence_jour
GROUP BY legislature, jour_semaine;

CREATE UNIQUE INDEX IF NOT EXISTS agg_assemblee_presence_jour_semaine_uq ON agg_assemblee_presence_jour_semaine (legislature, jour_semaine) NULLS NOT DISTINCT;
