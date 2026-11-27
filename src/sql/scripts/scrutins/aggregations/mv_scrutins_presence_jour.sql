-- ============================================================
-- VIEW : mv_scrutins_presence_jour
-- ============================================================
-- Votes d'un député aux scrutins publics, par jour. Brique « votes »
-- de la présence en hémicycle (voir mv_deputes_presence_jour,
-- domaine presence).
--
-- Logique :
--   - vote personnel = pour / contre / abstention, HORS délégation :
--     un vote par délégation (par_delegation) est émis par un collègue,
--     le député n'est pas en séance (~13 % des votes)
--   - non-votants comptés à part (président de séance, non-votant
--     volontaire…) : pas retenus comme preuve de présence (la
--     présidence de séance est déjà captée par les débats)
--   - votes_deputes ne contient que les députés ayant une position :
--     un député absent n'y a pas de ligne
--
-- Colonnes :
--   - legislature          : législature (legislature_snapshot du scrutin)
--   - acteur_uid           : député
--   - jour                 : date du scrutin
--   - votes_personnels     : votes pour / contre / abstention hors délégation
--   - votes_par_delegation : votes pour / contre / abstention par délégation
--   - non_votants          : positions « non votant »
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_scrutins_presence_jour AS
SELECT
    s.legislature_snapshot                                                                       AS legislature,
    vd.depute_id                                                                                 AS acteur_uid,
    s.date_scrutin                                                                               AS jour,
    COUNT(*) FILTER (WHERE vd.position IN ('pour', 'contre', 'abstention')
                        AND vd.par_delegation IS NOT TRUE)::int                                  AS votes_personnels,
    COUNT(*) FILTER (WHERE vd.position IN ('pour', 'contre', 'abstention')
                        AND vd.par_delegation)::int                                              AS votes_par_delegation,
    COUNT(*) FILTER (WHERE vd.position = 'non_votant')::int                                      AS non_votants
FROM votes_deputes vd
         JOIN scrutins s
              ON s.uid = vd.scrutin_uid
WHERE s.date_scrutin IS NOT NULL
GROUP BY 1, 2, 3;

CREATE UNIQUE INDEX IF NOT EXISTS mv_scrutins_presence_jour_uq ON mv_scrutins_presence_jour (legislature, acteur_uid, jour);
CREATE INDEX IF NOT EXISTS mv_scrutins_presence_jour_acteur_jour_idx ON mv_scrutins_presence_jour (acteur_uid, jour);
