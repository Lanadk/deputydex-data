-- ============================================================
-- VIEW : agg_deputes_dossiers_contributions
-- ============================================================
-- Contributions d'un député aux dossiers législatifs, par législature
-- (vocabulaire : GLOSSARY.md du front — Contribution, Texte, Étape…)
--
-- Logique :
--   - Rattache chaque amendement à son dossier via le texte amendé
--     (amendements.texte_leg_ref → documents_parlementaires.dossier_ref)
--   - Compte les amendements déposés, adoptés (parmi les déposés) et
--     co-signés par le député sur chaque dossier
--   - Ajoute les contributions au texte : auteur du texte
--     (dossier_initiateur) et co-signataire du texte
--     (documents_co_signataires sur un document du dossier)
--   - Ajoute les rôles de rapporteur, chacun rattaché à son étape :
--     code de l'étape racine (préfixe du code_acte : AN1, SN1, CMP…)
--   - Un dossier apparaît dès qu'une de ces contributions existe ;
--     la législature retenue est le legislature_snapshot de la
--     contribution (un dossier ouvert en 16e peut recevoir des
--     amendements en 17e)
--
-- Colonnes :
--   - depute_uid            : identifiant technique du député
--   - legislature           : législature de la contribution
--   - dossier_uid           : identifiant du dossier législatif
--   - dossier_titre         : titre du dossier
--   - dossier_legislature   : législature d'ouverture du dossier (pour le lien AN)
--   - procedure_libelle     : procédure du dossier (loi ordinaire, finances…)
--   - nb_deposes            : amendements déposés par le député
--   - nb_adoptes            : amendements déposés et adoptés
--   - nb_cosignes           : amendements co-signés
--   - is_auteur_texte       : le député est auteur du texte
--   - is_cosignataire_texte : le député est co-signataire du texte
--   - rapporteurs           : rôles de rapporteur distincts, jsonb
--                             [{ "type": "rapporteur pour avis", "etape": "AN1" }]
--   - derniere_activite     : date de la contribution la plus récente
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS agg_deputes_dossiers_contributions AS
WITH contributions AS (
    -- Amendements déposés
    SELECT
        a.acteur_uid               AS depute_uid,
        a.legislature_snapshot     AS legislature,
        d.dossier_ref              AS dossier_uid,
        'depose'::text             AS kind,
        (a.sort = 'Adopté')        AS is_adopte,
        NULL::jsonb                AS rapporteur,
        a.date_depot::date         AS activity_date
    FROM amendements a
             JOIN documents_parlementaires d ON d.uid = a.texte_leg_ref
    WHERE a.acteur_uid IS NOT NULL
      AND d.dossier_ref IS NOT NULL

    UNION ALL

    -- Amendements co-signés
    SELECT
        c.acteur_uid,
        a.legislature_snapshot,
        d.dossier_ref,
        'cosigne',
        FALSE,
        NULL,
        a.date_depot::date
    FROM amendements_co_auteurs c
             JOIN amendements a ON a.uid = c.amendement_uid
             JOIN documents_parlementaires d ON d.uid = a.texte_leg_ref
    WHERE d.dossier_ref IS NOT NULL

    UNION ALL

    -- Rapporteur, rattaché à l'étape racine de l'acte
    SELECT
        r.acteur_uid,
        r.legislature_snapshot,
        al.dossier_uid,
        'rapporteur',
        FALSE,
        jsonb_build_object(
            'type', r.type_rapporteur,
            'etape', split_part(al.code_acte, '-', 1)
        ),
        al.date_acte::date
    FROM acte_rapporteur r
             JOIN acte_legislatif al ON al.uid = r.acte_uid

    UNION ALL

    -- Auteur du texte
    SELECT
        i.acteur_uid,
        i.legislature_snapshot,
        i.dossier_uid,
        'auteur_texte',
        FALSE,
        NULL,
        NULL::date
    FROM dossier_initiateur i
    WHERE i.acteur_uid IS NOT NULL

    UNION ALL

    -- Co-signataire du texte
    SELECT
        s.acteur_uid,
        s.legislature_snapshot,
        d.dossier_ref,
        'cosignataire_texte',
        FALSE,
        NULL,
        d.date_depot::date
    FROM documents_co_signataires s
             JOIN documents_parlementaires d ON d.uid = s.document_uid
    WHERE s.acteur_uid IS NOT NULL
      AND d.dossier_ref IS NOT NULL
)
SELECT
    c.depute_uid,
    c.legislature,
    c.dossier_uid,
    dp.titre                                                              AS dossier_titre,
    dp.legislature                                                        AS dossier_legislature,
    dp.procedure_libelle,

    COUNT(*) FILTER (WHERE c.kind = 'depose')                             AS nb_deposes,
    COUNT(*) FILTER (WHERE c.kind = 'depose' AND c.is_adopte)             AS nb_adoptes,
    COUNT(*) FILTER (WHERE c.kind = 'cosigne')                            AS nb_cosignes,
    BOOL_OR(c.kind = 'auteur_texte')                                      AS is_auteur_texte,
    BOOL_OR(c.kind = 'cosignataire_texte')                                AS is_cosignataire_texte,
    COALESCE(
        jsonb_agg(DISTINCT c.rapporteur) FILTER (WHERE c.rapporteur IS NOT NULL),
        '[]'::jsonb
    )                                                                     AS rapporteurs,
    MAX(c.activity_date)                                                  AS derniere_activite

FROM contributions c
         JOIN dossier_parlementaire dp ON dp.uid = c.dossier_uid
GROUP BY
    c.depute_uid,
    c.legislature,
    c.dossier_uid,
    dp.titre,
    dp.legislature,
    dp.procedure_libelle;

CREATE UNIQUE INDEX IF NOT EXISTS agg_deputes_dossiers_contributions_uq
    ON agg_deputes_dossiers_contributions (depute_uid, legislature, dossier_uid);
