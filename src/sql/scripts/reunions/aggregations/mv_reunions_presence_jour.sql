-- ============================================================
-- VIEW : mv_reunions_presence_jour
-- ============================================================
-- Présences en commission (et autres organes à liste de présence)
-- d'un député, par jour. Brique « commission » de la présence
-- (voir mv_deputes_presence_jour, domaine presence).
--
-- Source : reunions_participants, liste reconstruite par l'AN à
-- partir du compte rendu (voir sql/scripts/reunions/README.md) :
--   - « Présents » et « Assistaient également » → présent
--   - « Excusés » → excusé
--   - membre de l'organe cité nulle part → absent (déduit)
--
-- Logique :
--   - réunions confirmées uniquement (les annulées / supprimées
--     peuvent garder une liste résiduelle), et déjà tenues : une
--     réunion à venir peut avoir une liste pré-remplie (tous
--     « absents ») qui n'est pas une absence
--   - jour = date de début de la réunion, heure de Paris
--   - membre = le député a un mandat dans l'organe réuni à cette
--     date (mandats.organe_uid). C'est le dénominateur du taux de
--     présence en commission : un « présent » non membre est une
--     présence volontaire (« Assistaient également »), comptée à part
--
-- Colonnes :
--   - legislature           : législature de l'archive (legislature_snapshot)
--   - acteur_uid            : député
--   - jour                  : date (heure de Paris)
--   - convocations          : réunions où il est membre de l'organe
--   - presences             : … et noté présent
--   - excuses               : … et noté excusé
--   - absences              : … et noté absent
--   - presences_hors_mandat : présent à une réunion d'un organe dont
--                             il n'est pas membre ce jour-là
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_reunions_presence_jour AS
WITH lignes AS (
    SELECT
        r.legislature_snapshot                               AS legislature,
        p.acteur_uid,
        (r.date_debut AT TIME ZONE 'Europe/Paris')::date      AS jour,
        p.presence,
        EXISTS (
            SELECT 1
            FROM mandats m
            WHERE m.acteur_uid = p.acteur_uid
              AND m.organe_uid = r.organe_uid
              AND m.date_debut <= (r.date_debut AT TIME ZONE 'Europe/Paris')::date
              AND (m.date_fin IS NULL OR m.date_fin >= (r.date_debut AT TIME ZONE 'Europe/Paris')::date)
        )                                                    AS membre
    FROM reunions r
             JOIN reunions_participants p
                  ON p.reunion_uid = r.uid
    WHERE r.etat = 'Confirmé'
      AND r.date_debut <= now()
)
SELECT
    legislature,
    acteur_uid,
    jour,
    COUNT(*) FILTER (WHERE membre)::int                              AS convocations,
    COUNT(*) FILTER (WHERE membre AND presence = 'présent')::int     AS presences,
    COUNT(*) FILTER (WHERE membre AND presence = 'excusé')::int      AS excuses,
    COUNT(*) FILTER (WHERE membre AND presence = 'absent')::int      AS absences,
    COUNT(*) FILTER (WHERE NOT membre AND presence = 'présent')::int AS presences_hors_mandat
FROM lignes
GROUP BY legislature, acteur_uid, jour;

CREATE UNIQUE INDEX IF NOT EXISTS mv_reunions_presence_jour_uq ON mv_reunions_presence_jour (legislature, acteur_uid, jour);
CREATE INDEX IF NOT EXISTS mv_reunions_presence_jour_acteur_jour_idx ON mv_reunions_presence_jour (acteur_uid, jour);
