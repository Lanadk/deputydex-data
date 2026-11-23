-- ============================================================
-- VIEW : agg_deputes_tendances_recentes
-- ============================================================
-- Activité récente de chaque député, par législature, sur une
-- fenêtre glissante de 30 jours (« ce mois-ci » de l'accueil).
--
-- Fenêtre : les 30 jours qui se terminent au DERNIER scrutin de la
-- législature (bornes incluses), et non à la date du jour : pendant
-- les vacances parlementaires ou une fois la législature terminée,
-- on garde le dernier mois d'activité au lieu d'une fenêtre vide.
--
-- Logique :
--   - votes_exprimes : scrutins de la fenêtre où le député a voté
--     pour, contre ou s'est abstenu (même définition que
--     agg_deputes_stats_votes ; votes_deputes ne contient que les
--     députés ayant pris part au vote)
--   - votes_rebelles : votes exprimés différents de la position
--     majoritaire de son groupe sur le scrutin (même règle que
--     total_rebel de agg_deputes_stats_votes / isVoteRebelle côté front)
--   - amendements_deposes : amendements dont le député est l'auteur
--     (pas les co-signatures), déposés dans la fenêtre
--
-- Une ligne par député ayant voté OU déposé un amendement dans la
-- fenêtre. Le classement (plus assidu, rebelle, amendements) est fait
-- par le front (règle métier dans le use-case).
--
-- Colonnes :
--   - legislature          : législature (legislature_snapshot)
--   - depute_uid           : identifiant du député (acteur)
--   - periode_debut        : premier jour de la fenêtre
--   - periode_fin          : date du dernier scrutin de la législature
--   - scrutins_periode     : nombre de scrutins dans la fenêtre
--   - votes_exprimes       : nombre de votes pour / contre / abstention
--   - votes_rebelles       : nombre de votes contraires au groupe
--   - amendements_deposes  : nombre d'amendements déposés (auteur)
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS agg_deputes_tendances_recentes AS
WITH periodes AS (
    SELECT
        s.legislature_snapshot                    AS legislature,
        (MAX(s.date_scrutin) - INTERVAL '29 days')::date AS periode_debut,
        MAX(s.date_scrutin)                       AS periode_fin
    FROM scrutins s
    WHERE s.date_scrutin IS NOT NULL
    GROUP BY s.legislature_snapshot
),
     scrutins_periode AS (
         SELECT s.uid, p.legislature
         FROM scrutins s
                  JOIN periodes p
                       ON p.legislature = s.legislature_snapshot
                           AND s.date_scrutin BETWEEN p.periode_debut AND p.periode_fin
     ),
     nb_scrutins AS (
         SELECT legislature, COUNT(*)::int AS scrutins_periode
         FROM scrutins_periode
         GROUP BY legislature
     ),
     votes AS (
         SELECT
             sp.legislature,
             vd.depute_id                                                                   AS depute_uid,
             COUNT(*) FILTER (WHERE vd.position IN ('pour', 'contre', 'abstention'))::int   AS votes_exprimes,
             COUNT(*) FILTER (WHERE sg.position_majoritaire IS NOT NULL
                                 AND vd.position IN ('pour', 'contre', 'abstention')
                                 AND vd.position != sg.position_majoritaire)::int           AS votes_rebelles
         FROM scrutins_periode sp
                  JOIN votes_deputes vd
                       ON vd.scrutin_uid = sp.uid
                  LEFT JOIN scrutins_groupes sg
                            ON sg.scrutin_uid = vd.scrutin_uid
                                AND sg.groupe_id = vd.groupe_id
         GROUP BY sp.legislature, vd.depute_id
     ),
     amendements_periode AS (
         SELECT
             p.legislature,
             a.acteur_uid       AS depute_uid,
             COUNT(*)::int      AS amendements_deposes
         FROM amendements a
                  JOIN periodes p
                       ON p.legislature = a.legislature_snapshot
                           AND a.date_depot BETWEEN p.periode_debut AND p.periode_fin
         WHERE a.acteur_uid IS NOT NULL
         GROUP BY p.legislature, a.acteur_uid
     ),
     activite AS (
         SELECT
             COALESCE(v.legislature, am.legislature)  AS legislature,
             COALESCE(v.depute_uid, am.depute_uid)    AS depute_uid,
             COALESCE(v.votes_exprimes, 0)            AS votes_exprimes,
             COALESCE(v.votes_rebelles, 0)            AS votes_rebelles,
             COALESCE(am.amendements_deposes, 0)      AS amendements_deposes
         FROM votes v
                  FULL OUTER JOIN amendements_periode am
                                  ON am.legislature = v.legislature
                                      AND am.depute_uid = v.depute_uid
     )
SELECT
    a.legislature,
    a.depute_uid,
    p.periode_debut,
    p.periode_fin,
    COALESCE(n.scrutins_periode, 0) AS scrutins_periode,
    a.votes_exprimes,
    a.votes_rebelles,
    a.amendements_deposes
FROM activite a
         JOIN periodes p
              ON p.legislature = a.legislature
         LEFT JOIN nb_scrutins n
                   ON n.legislature = a.legislature;

CREATE UNIQUE INDEX IF NOT EXISTS agg_deputes_tendances_recentes_uq ON agg_deputes_tendances_recentes (legislature, depute_uid);
