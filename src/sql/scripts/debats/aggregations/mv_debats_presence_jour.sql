-- ============================================================
-- VIEW : mv_debats_presence_jour
-- ============================================================
-- Prises de parole d'un député en séance publique, par jour.
-- Brique « débats » de la présence en hémicycle (voir
-- mv_deputes_presence_jour, domaine presence) : un député qui parle
-- ou interrompt pendant une séance y est présent. Borne basse : un
-- député présent mais silencieux n'apparaît pas.
--
-- Source : debats_interventions_orateurs (tous les orateurs d'un
-- paragraphe, y compris les interruptions communes), orateurs
-- identifiés uniquement (acteur_uid non null).
--
-- Colonnes :
--   - legislature        : législature de l'archive (legislature_snapshot)
--   - acteur_uid         : député
--   - jour               : date de la séance (heure de Paris)
--   - seances            : séances où il a pris la parole
--   - prises_de_parole   : paragraphes hors interruptions et hors
--                          présidence de séance
--   - interruptions      : paragraphes INTERRUPTION_… (« Très bien ! »)
--   - paroles_presidence : paragraphes prononcés en présidant la séance
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_debats_presence_jour AS
SELECT
    c.legislature_snapshot                                 AS legislature,
    o.acteur_uid,
    (c.date_seance AT TIME ZONE 'Europe/Paris')::date       AS jour,
    COUNT(DISTINCT c.uid)::int                             AS seances,
    COUNT(*) FILTER (WHERE COALESCE(i.code_grammaire, '') NOT LIKE 'INTERRUPTION%'
                        AND i.role_debat IS DISTINCT FROM 'president')::int AS prises_de_parole,
    COUNT(*) FILTER (WHERE i.code_grammaire LIKE 'INTERRUPTION%')::int        AS interruptions,
    COUNT(*) FILTER (WHERE i.role_debat = 'president')::int                   AS paroles_presidence
FROM debats_comptes_rendus c
         JOIN debats_interventions i
              ON i.compte_rendu_uid = c.uid
         JOIN debats_interventions_orateurs o
              ON o.intervention_id = i.id
WHERE o.acteur_uid IS NOT NULL
  AND c.date_seance IS NOT NULL
GROUP BY 1, 2, 3;

CREATE UNIQUE INDEX IF NOT EXISTS mv_debats_presence_jour_uq ON mv_debats_presence_jour (legislature, acteur_uid, jour);
CREATE INDEX IF NOT EXISTS mv_debats_presence_jour_acteur_jour_idx ON mv_debats_presence_jour (acteur_uid, jour);
