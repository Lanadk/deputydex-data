BEGIN;

-- Ordre : comptes rendus, puis points et interventions (qui les référencent),
-- puis orateurs (qui référencent les interventions). Clés étrangères
-- ON DELETE CASCADE : supprimer un compte rendu supprime tout son contenu.

-- =====================================================
-- DEBATS COMPTES RENDUS
-- =====================================================

INSERT INTO debats_comptes_rendus (uid, seance_uid, session_ref, date_seance, date_seance_libelle, num_seance,
                                   quantieme, legislature, session_libelle, num_jo, etat, validite, version,
                                   row_hash, legislature_snapshot)
SELECT uid, seance_uid, session_ref, date_seance, date_seance_libelle, num_seance,
       quantieme, legislature, session_libelle, num_jo, etat, validite, version,
       row_hash, legislature_snapshot
FROM debats_comptes_rendus_snapshot
ON CONFLICT (uid) DO UPDATE
    SET seance_uid           = EXCLUDED.seance_uid,
        session_ref          = EXCLUDED.session_ref,
        date_seance          = EXCLUDED.date_seance,
        date_seance_libelle  = EXCLUDED.date_seance_libelle,
        num_seance           = EXCLUDED.num_seance,
        quantieme            = EXCLUDED.quantieme,
        legislature          = EXCLUDED.legislature,
        session_libelle      = EXCLUDED.session_libelle,
        num_jo               = EXCLUDED.num_jo,
        etat                 = EXCLUDED.etat,
        validite             = EXCLUDED.validite,
        version              = EXCLUDED.version,
        row_hash             = EXCLUDED.row_hash,
        legislature_snapshot = EXCLUDED.legislature_snapshot,
        updated_at           = now()
WHERE debats_comptes_rendus.row_hash != EXCLUDED.row_hash;

DELETE
FROM debats_comptes_rendus c
WHERE c.legislature_snapshot IN (SELECT number FROM param_current_legislatures)
  AND NOT EXISTS (SELECT 1 FROM debats_comptes_rendus_snapshot s WHERE s.uid = c.uid);

-- =====================================================
-- DEBATS POINTS
-- =====================================================

INSERT INTO debats_points (id, compte_rendu_uid, parent_id, profondeur, ordre, valeur_pts_odj, code_grammaire, titre,
                           row_hash, legislature_snapshot)
SELECT id, compte_rendu_uid, parent_id, profondeur, ordre, valeur_pts_odj, code_grammaire, titre,
       row_hash, legislature_snapshot
FROM debats_points_snapshot
ON CONFLICT (id) DO UPDATE
    SET compte_rendu_uid     = EXCLUDED.compte_rendu_uid,
        parent_id            = EXCLUDED.parent_id,
        profondeur           = EXCLUDED.profondeur,
        ordre                = EXCLUDED.ordre,
        valeur_pts_odj       = EXCLUDED.valeur_pts_odj,
        code_grammaire       = EXCLUDED.code_grammaire,
        titre                = EXCLUDED.titre,
        row_hash             = EXCLUDED.row_hash,
        legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE debats_points.row_hash != EXCLUDED.row_hash;

DELETE
FROM debats_points p
WHERE p.legislature_snapshot IN (SELECT number FROM param_current_legislatures)
  AND NOT EXISTS (SELECT 1 FROM debats_points_snapshot s WHERE s.id = p.id);

-- =====================================================
-- DEBATS INTERVENTIONS
-- =====================================================

INSERT INTO debats_interventions (id, compte_rendu_uid, point_id, ordre, acteur_uid, mandat_uid, role_debat,
                                  code_grammaire, code_style, type_debat, orateurs_libelle, texte, stime,
                                  bibard, article, amendement, sous_amendement, amendement_uid, decision,
                                  row_hash, legislature_snapshot)
SELECT id, compte_rendu_uid, point_id, ordre, acteur_uid, mandat_uid, role_debat,
       code_grammaire, code_style, type_debat, orateurs_libelle, texte, stime,
       bibard, article, amendement, sous_amendement, amendement_uid, decision,
       row_hash, legislature_snapshot
FROM debats_interventions_snapshot
ON CONFLICT (id) DO UPDATE
    SET compte_rendu_uid     = EXCLUDED.compte_rendu_uid,
        point_id             = EXCLUDED.point_id,
        ordre                = EXCLUDED.ordre,
        acteur_uid           = EXCLUDED.acteur_uid,
        mandat_uid           = EXCLUDED.mandat_uid,
        role_debat           = EXCLUDED.role_debat,
        code_grammaire       = EXCLUDED.code_grammaire,
        code_style           = EXCLUDED.code_style,
        type_debat           = EXCLUDED.type_debat,
        orateurs_libelle     = EXCLUDED.orateurs_libelle,
        texte                = EXCLUDED.texte,
        stime                = EXCLUDED.stime,
        bibard               = EXCLUDED.bibard,
        article              = EXCLUDED.article,
        amendement           = EXCLUDED.amendement,
        sous_amendement      = EXCLUDED.sous_amendement,
        amendement_uid       = EXCLUDED.amendement_uid,
        decision             = EXCLUDED.decision,
        row_hash             = EXCLUDED.row_hash,
        legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE debats_interventions.row_hash != EXCLUDED.row_hash;

DELETE
FROM debats_interventions i
WHERE i.legislature_snapshot IN (SELECT number FROM param_current_legislatures)
  AND NOT EXISTS (SELECT 1 FROM debats_interventions_snapshot s WHERE s.id = i.id);

-- =====================================================
-- DEBATS INTERVENTIONS ORATEURS
-- =====================================================

INSERT INTO debats_interventions_orateurs (intervention_id, ordre, acteur_uid, nom, qualite, row_hash,
                                           legislature_snapshot)
SELECT intervention_id, ordre, acteur_uid, nom, qualite, row_hash, legislature_snapshot
FROM debats_interventions_orateurs_snapshot
ON CONFLICT (intervention_id, ordre) DO UPDATE
    SET acteur_uid           = EXCLUDED.acteur_uid,
        nom                  = EXCLUDED.nom,
        qualite              = EXCLUDED.qualite,
        row_hash             = EXCLUDED.row_hash,
        legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE debats_interventions_orateurs.row_hash != EXCLUDED.row_hash;

DELETE
FROM debats_interventions_orateurs o
WHERE o.legislature_snapshot IN (SELECT number FROM param_current_legislatures)
  AND NOT EXISTS (SELECT 1
                  FROM debats_interventions_orateurs_snapshot s
                  WHERE s.intervention_id = o.intervention_id
                    AND s.ordre = o.ordre);

COMMIT;
