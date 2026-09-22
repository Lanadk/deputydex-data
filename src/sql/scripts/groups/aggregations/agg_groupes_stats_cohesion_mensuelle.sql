-- OK VALIDE (2026-09-22, validation croisée avec Datan.fr — voir
-- agg_groupes_stats_cohesion_legislature.sql pour le détail)

-- ============================================================
-- VIEW : agg_groupes_stats_cohesion_mensuelle
-- ============================================================
-- Cohésion politique mensuelle des groupes parlementaires
--
-- Logique :
--   - Pour chaque (scrutin, groupe), calcule l'Agreement Index de
--     Hix/Noury/Roland (2005) : AI = (max(Y,N,A) - 0,5*((Y+N+A) -
--     max(Y,N,A))) / (Y+N+A), avec Y/N/A = pour/contre/abstention DU
--     GROUPE sur ce scrutin (source scrutins_groupes_agregats,
--     comptages bruts) — même formule que
--     agg_groupes_stats_cohesion_legislature, voir ce fichier pour le
--     détail de la validation croisée avec Datan.fr et pourquoi la
--     position "majoritaire" est RECALCULÉE ici (max(Y,N,A)) plutôt
--     que lue depuis scrutins_groupes.position_majoritaire.
--   - Le taux de cohésion final est la moyenne NON pondérée des AI par
--     scrutin (chaque scrutin = une observation, quel que soit son
--     nombre de votants) — convention standard des indices de
--     cohésion parlementaire (cf. VoteWatch Europe, Hix/Noury/Roland)
--   - Seuls les scrutins où au moins 5 membres du groupe ont voté
--     (pour/contre/abstention) sont pris en compte
--   - Le taux de cohésion est exprimé sur une échelle de 0 à 1
--   - ATTENTION lecture : un mois avec très peu de scrutins (ex: 1
--     seul scrutin en rentrée parlementaire) peut afficher un score
--     très éloigné des mois voisins — ce n'est PAS du bruit
--     statistique à filtrer, un scrutin serré/contesté isolé est un
--     vrai événement (cf. DR/09-2025, confirmé par Datan.fr). Pas de
--     plancher de nb_scrutins_mois ici, volontairement.
--
-- Colonnes :
--   - groupe_id            : identifiant technique du groupe
--   - legislature          : législature
--   - code                 : code court du groupe
--   - libelle              : nom du groupe
--   - mois                 : mois d'observation
--   - nb_scrutins_mois     : nombre de scrutins du mois pris en compte
--   - nb_votes_eligibles   : nombre total de votes comparables (pour+contre+abstention)
--   - nb_votes_alignes     : nombre total de votes alignés avec la position majoritaire RECALCULÉE (max(Y,N,A))
--   - taux_cohesion        : score de cohésion (Agreement Index), entre 0 et 1
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS agg_groupes_stats_cohesion_mensuelle AS
WITH cohesion_par_scrutin AS (
    SELECT
        sga.groupe_id,
        sga.groupe_legislature AS legislature,
        sga.scrutin_uid,
        date_trunc('month', s.date_scrutin)::date AS mois,
        COALESCE(sga.pour, 0) AS pour,
        COALESCE(sga.contre, 0) AS contre,
        COALESCE(sga.abstentions, 0) AS abstentions,
        COALESCE(sga.pour, 0) + COALESCE(sga.contre, 0) + COALESCE(sga.abstentions, 0) AS total_votants
    FROM scrutins_groupes_agregats sga
             INNER JOIN scrutins s
                        ON s.uid = sga.scrutin_uid
    WHERE s.date_scrutin IS NOT NULL
      AND (
              COALESCE(sga.pour, 0)
                  + COALESCE(sga.contre, 0)
                  + COALESCE(sga.abstentions, 0)
          ) >= 5
),
     cohesion_par_scrutin_calculee AS (
         SELECT
             cps.groupe_id,
             cps.legislature,
             cps.scrutin_uid,
             cps.mois,
             cps.total_votants,
             GREATEST(cps.pour, cps.contre, cps.abstentions) AS max_position,
             (
                 GREATEST(cps.pour, cps.contre, cps.abstentions)::numeric
                     - 0.5 * (cps.total_votants - GREATEST(cps.pour, cps.contre, cps.abstentions))
             ) / NULLIF(cps.total_votants, 0) AS taux_cohesion_scrutin
         FROM cohesion_par_scrutin cps
     )
SELECT
    c.groupe_id,
    c.legislature,
    rg.code,
    rg.libelle,
    c.mois,
    COUNT(DISTINCT c.scrutin_uid) AS nb_scrutins_mois,
    SUM(c.total_votants) AS nb_votes_eligibles,
    SUM(c.max_position) AS nb_votes_alignes,
    ROUND(AVG(c.taux_cohesion_scrutin), 4) AS taux_cohesion
FROM cohesion_par_scrutin_calculee c
         LEFT JOIN ref_groupes rg
                   ON rg.groupe_id = c.groupe_id
                       AND rg.groupe_legislature = c.legislature
GROUP BY
    c.groupe_id,
    c.legislature,
    rg.code,
    rg.libelle,
    c.mois;

CREATE UNIQUE INDEX IF NOT EXISTS agg_groupes_stats_cohesion_mensuelle_uq ON agg_groupes_stats_cohesion_mensuelle (groupe_id, legislature, mois);