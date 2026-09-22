-- OK VALIDE (2026-09-22, validation croisée avec Datan.fr, cf. section
-- "Validation" ci-dessous)

-- ============================================================
-- VIEW : agg_groupes_stats_cohesion_legislature
-- ============================================================
-- Synthèse de la cohésion des groupes parlementaires
-- à l'échelle de la législature
--
-- Logique :
--   - Pour chaque (scrutin, groupe), calcule l'Agreement Index de
--     Hix/Noury/Roland (2005) : AI = (max(Y,N,A) - 0,5*((Y+N+A) -
--     max(Y,N,A))) / (Y+N+A), avec Y/N/A = pour/contre/abstention DU
--     GROUPE sur ce scrutin (source scrutins_groupes_agregats,
--     comptages bruts). La position "majoritaire" du groupe est donc
--     RECALCULÉE ici comme le max(Y,N,A) — volontairement PAS lue
--     depuis scrutins_groupes.position_majoritaire (le champ publié
--     tel quel par l'Assemblée nationale), qui diverge de la vraie
--     pluralité des votes sur ~4% des scrutins (concentré sur les
--     votes serrés/contestés) et gonflait ou déflatait artificiellement
--     le score selon les cas.
--   - Le taux de cohésion final correspond à la moyenne NON pondérée
--     des AI par scrutin (chaque scrutin = une observation, quel que
--     soit son nombre de votants) — convention standard des indices
--     de cohésion parlementaire (cf. VoteWatch Europe, Hix/Noury/Roland)
--   - Seuls les scrutins où au moins 5 membres du groupe ont
--     voté (pour/contre/abstention) sont pris en compte, pour
--     éviter qu'un scrutin à très faible participation du groupe
--     fausse le taux (aligné avec agg_groupes_stats_cohesion_mensuelle)
--   - Le score est exprimé sur une échelle de 0 à 1
--
-- Colonnes :
--   - groupe_id              : identifiant technique du groupe
--   - legislature            : législature
--   - code                   : code court du groupe
--   - libelle                : nom du groupe
--   - nb_scrutins_couverts   : nombre de scrutins pris en compte
--   - nb_votes_eligibles     : nombre total de votes comparables (pour+contre+abstention)
--   - nb_votes_alignes       : nombre total de votes alignés avec la position majoritaire RECALCULÉE (max(Y,N,A))
--   - taux_cohesion          : score de cohésion (Agreement Index), entre 0 et 1
--
-- Validation :
--   - Comparé à Datan.fr (qui utilise la même formule AI, cf.
--     https://datan.fr/statistiques/aide#cohesion) sur legislature 17 :
--     LFI-NFP = 0,984 ici vs 0,98 publié par Datan ; DR en 09/2025
--     (agg_groupes_stats_cohesion_mensuelle) = 0,3265 ici vs ~0,33
--     publié par Datan — cas reproduit exactement à partir du détail
--     du scrutin (pour=27, contre=13, abstention=9 → AI = (27-11)/49).
--     Avant cette réécriture, l'ancienne formule (lecture directe de
--     position_majoritaire + simple % aligné) donnait 0,1837 sur ce
--     même point, à cause de la divergence évoquée ci-dessus.
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS agg_groupes_stats_cohesion_legislature AS
WITH cohesion_par_scrutin AS (
    SELECT
        sga.groupe_id,
        sga.groupe_legislature AS legislature,
        sga.scrutin_uid,
        COALESCE(sga.pour, 0) AS pour,
        COALESCE(sga.contre, 0) AS contre,
        COALESCE(sga.abstentions, 0) AS abstentions,
        COALESCE(sga.pour, 0) + COALESCE(sga.contre, 0) + COALESCE(sga.abstentions, 0) AS total_votants
    FROM scrutins_groupes_agregats sga
    WHERE (
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
    COUNT(DISTINCT c.scrutin_uid) AS nb_scrutins_couverts,
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
    rg.libelle;

CREATE UNIQUE INDEX IF NOT EXISTS agg_groupes_stats_cohesion_legislature_uq ON agg_groupes_stats_cohesion_legislature (groupe_id, legislature);