-- ============================================================
-- VIEW : mv_deputes_presence_jour
-- ============================================================
-- Présence d'un député, jour par jour : la base de tous les taux de
-- présence (agg_deputes_presence*, agg_groupes_presence*,
-- agg_assemblee_presence*). Consolide les briques par source, chacune
-- dans son domaine :
--
--   | Brique (domaine)                     | Ce qu'elle apporte                         |
--   |--------------------------------------|--------------------------------------------|
--   | mv_debats_seances_jours (debats)     | séances réellement tenues (compte rendu)   |
--   | mv_reunions_presence_jour (reunions) | convocations en commission → jour attendu ; |
--   |                                      | présent / excusé / absent                  |
--   | mv_scrutins_presence_jour (scrutins) | votes personnels (hors délégation)         |
--   | mv_scrutins_jours (scrutins)         | scrutins du jour (participation)           |
--   | mv_debats_presence_jour (debats)     | prises de parole, interruptions, présidence |
--
-- Règles :
--   - période de mandat : mandats ASSEMBLEE, de la prise de fonction à
--     la fin de mandat. Un député devenu ministre n'est plus attendu.
--   - jour de séance : une séance s'est réellement tenue, prouvée par un
--     compte rendu publié ou au moins un scrutin public. Pas l'agenda,
--     qui marque « Confirmé » des séances annulées et contient les
--     séances à venir.
--   - séance observable : un jour de séance avec au moins un scrutin
--     public. Les séances sans aucun vote (~30 à 40 jours par
--     législature : questions au Gouvernement, semaines de contrôle,
--     déclarations du Gouvernement suivies d'un débat, installation du
--     bureau) ne laissent voir que les orateurs (souvent < 100 sur 577,
--     hémicycle pourtant plein) : la présence n'y est pas mesurable. Ces
--     jours ne sont donc pas « attendus » ; une prise de parole ce
--     jour-là reste une présence (non attendue).
--   - jour attendu : une séance observable pendant le mandat, ou un jour
--     où il est convoqué (membre de l'organe) à une réunion à liste de
--     présence.
--   - présent en séance : au moins un vote personnel, une prise de
--     parole, une interruption ou une présidence de séance.
--   - présent en commission : noté présent à une réunion, membre ou non.
--   - jour présent : présent en séance ou en commission.
--   - groupe : mandat GP du député ce jour-là (null si aucun).
--
-- Une ligne par (député, jour) : jours attendus, et jours de présence
-- non attendus (présence volontaire, ex. « Assistaient également » un
-- jour sans séance).
--
-- Colonnes :
--   - legislature            : législature du mandat de député
--   - acteur_uid             : député
--   - jour                   : date
--   - groupe_uid             : groupe politique ce jour-là
--   - debut_mandat           : première prise de fonction du député dans la
--                              législature (base de l'année de mandat)
--   - jour_seance            : un jour de séance publique
--   - seance_observable      : jour de séance avec au moins un scrutin public
--   - attendu                : jour où le député est attendu
--   - present                : jour de présence (séance ou commission)
--   - present_seance         : présent en séance publique
--   - present_commission     : présent en commission
--   - scrutins_jour          : scrutins publics ce jour-là (0 hors séance)
--   - votes_personnels       : votes hors délégation
--   - votes_par_delegation   : votes par délégation
--   - prises_de_parole       : paragraphes de parole (hors présidence)
--   - interruptions          : interruptions
--   - paroles_presidence     : paragraphes en présidant la séance
--   - convocations           : réunions où il est membre de l'organe
--   - presences_commission   : … noté présent
--   - excuses_commission     : … noté excusé
--   - absences_commission    : … noté absent
--   - presences_hors_mandat  : présent à une réunion d'un organe dont il
--                              n'est pas membre
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_deputes_presence_jour AS
WITH mandats_depute AS (
    SELECT DISTINCT
        m.acteur_uid,
        m.legislature,
        COALESCE(m.mandature_date_prise_fonction, m.date_debut) AS debut,
        COALESCE(m.date_fin, 'infinity'::date)                  AS fin
    FROM mandats m
    WHERE m.type_organe = 'ASSEMBLEE'
),
     -- Première prise de fonction dans la législature : un député qui quitte puis
     -- retrouve son siège (passage au Gouvernement…) garde le même point de départ.
     debuts_mandat AS (
         SELECT acteur_uid, legislature, MIN(debut) AS debut_mandat
         FROM mandats_depute
         GROUP BY acteur_uid, legislature
     ),
     -- Séances réellement tenues : un compte rendu publié ou un scrutin public.
     jours_seance AS (
         SELECT legislature, jour FROM mv_debats_seances_jours
         UNION
         SELECT legislature, jour FROM mv_scrutins_jours
     ),
     -- Agrégats par (député, jour), toutes législatures d'archive confondues :
     -- la législature retenue est celle du mandat.
     commission AS (
         SELECT acteur_uid, jour,
                SUM(convocations)::int          AS convocations,
                SUM(presences)::int             AS presences,
                SUM(excuses)::int               AS excuses,
                SUM(absences)::int              AS absences,
                SUM(presences_hors_mandat)::int AS presences_hors_mandat
         FROM mv_reunions_presence_jour
         GROUP BY acteur_uid, jour
     ),
     votes AS (
         SELECT acteur_uid, jour,
                SUM(votes_personnels)::int     AS votes_personnels,
                SUM(votes_par_delegation)::int AS votes_par_delegation
         FROM mv_scrutins_presence_jour
         GROUP BY acteur_uid, jour
     ),
     debats AS (
         SELECT acteur_uid, jour,
                SUM(prises_de_parole)::int   AS prises_de_parole,
                SUM(interruptions)::int      AS interruptions,
                SUM(paroles_presidence)::int AS paroles_presidence
         FROM mv_debats_presence_jour
         GROUP BY acteur_uid, jour
     ),
     scrutins_jour AS (
         SELECT jour, SUM(scrutins)::int AS scrutins
         FROM mv_scrutins_jours
         GROUP BY jour
     ),
     -- Jours candidats pendant un mandat : séances, et tout jour où une source
     -- a une ligne pour le député.
     jours AS (
         SELECT md.acteur_uid, md.legislature, js.jour
         FROM mandats_depute md
                  JOIN jours_seance js
                       ON js.legislature = md.legislature
                           AND js.jour BETWEEN md.debut AND md.fin
         UNION
         SELECT md.acteur_uid, md.legislature, src.jour
         FROM mandats_depute md
                  JOIN (SELECT acteur_uid, jour FROM commission
                        UNION SELECT acteur_uid, jour FROM votes
                        UNION SELECT acteur_uid, jour FROM debats) src
                       ON src.acteur_uid = md.acteur_uid
                           AND src.jour BETWEEN md.debut AND md.fin
     ),
     detail AS (
         SELECT
             j.legislature,
             j.acteur_uid,
             j.jour,
             (js.jour IS NOT NULL)                       AS jour_seance,
             COALESCE(sj.scrutins, 0)                    AS scrutins_jour,
             COALESCE(v.votes_personnels, 0)             AS votes_personnels,
             COALESCE(v.votes_par_delegation, 0)         AS votes_par_delegation,
             COALESCE(d.prises_de_parole, 0)             AS prises_de_parole,
             COALESCE(d.interruptions, 0)                AS interruptions,
             COALESCE(d.paroles_presidence, 0)           AS paroles_presidence,
             COALESCE(c.convocations, 0)                 AS convocations,
             COALESCE(c.presences, 0)                    AS presences_commission,
             COALESCE(c.excuses, 0)                      AS excuses_commission,
             COALESCE(c.absences, 0)                     AS absences_commission,
             COALESCE(c.presences_hors_mandat, 0)        AS presences_hors_mandat
         FROM jours j
                  LEFT JOIN jours_seance js
                            ON js.legislature = j.legislature AND js.jour = j.jour
                  LEFT JOIN scrutins_jour sj ON sj.jour = j.jour
                  LEFT JOIN votes v ON v.acteur_uid = j.acteur_uid AND v.jour = j.jour
                  LEFT JOIN debats d ON d.acteur_uid = j.acteur_uid AND d.jour = j.jour
                  LEFT JOIN commission c ON c.acteur_uid = j.acteur_uid AND c.jour = j.jour
     )
SELECT
    dt.legislature,
    dt.acteur_uid,
    dt.jour,
    gp.organe_uid                                                                        AS groupe_uid,
    dm.debut_mandat,
    dt.jour_seance,
    (dt.jour_seance AND dt.scrutins_jour > 0)                                            AS seance_observable,
    ((dt.jour_seance AND dt.scrutins_jour > 0) OR dt.convocations > 0)                   AS attendu,
    (dt.votes_personnels + dt.prises_de_parole + dt.interruptions + dt.paroles_presidence > 0
        OR dt.presences_commission + dt.presences_hors_mandat > 0)                      AS present,
    (dt.votes_personnels + dt.prises_de_parole + dt.interruptions + dt.paroles_presidence > 0) AS present_seance,
    (dt.presences_commission + dt.presences_hors_mandat > 0)                            AS present_commission,
    dt.scrutins_jour,
    dt.votes_personnels,
    dt.votes_par_delegation,
    dt.prises_de_parole,
    dt.interruptions,
    dt.paroles_presidence,
    dt.convocations,
    dt.presences_commission,
    dt.excuses_commission,
    dt.absences_commission,
    dt.presences_hors_mandat
FROM detail dt
         JOIN debuts_mandat dm
              ON dm.acteur_uid = dt.acteur_uid AND dm.legislature = dt.legislature
         LEFT JOIN LATERAL (
    SELECT m.organe_uid
    FROM mandats m
    WHERE m.acteur_uid = dt.acteur_uid
      AND m.type_organe = 'GP'
      AND m.date_debut <= dt.jour
      AND (m.date_fin IS NULL OR m.date_fin >= dt.jour)
    ORDER BY m.date_debut DESC
    LIMIT 1
    ) gp ON TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS mv_deputes_presence_jour_uq ON mv_deputes_presence_jour (acteur_uid, jour);
CREATE INDEX IF NOT EXISTS mv_deputes_presence_jour_leg_idx ON mv_deputes_presence_jour (legislature, jour);
CREATE INDEX IF NOT EXISTS mv_deputes_presence_jour_groupe_idx ON mv_deputes_presence_jour (legislature, groupe_uid, jour);
