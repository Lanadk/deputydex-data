BEGIN;

-- Les réunions sont synchronisées en premier : participants et points de
-- l'ordre du jour les référencent (clé étrangère ON DELETE CASCADE).

-- =====================================================
-- REUNIONS
-- =====================================================

INSERT INTO reunions (uid, type_reunion, legislature, organe_uid, etat, date_debut, date_fin,
                      session_ref, compte_rendu_ref, lieu_ref, lieu_libelle, format_reunion,
                      sous_type_reunion, visio_conference, captation_video, ouverture_presse,
                      est_reunion_internationale, date_seance, id_jo, num_seance_jo, quantieme,
                      resume_odj, convocation_odj, row_hash, legislature_snapshot)
SELECT uid, type_reunion, legislature, organe_uid, etat, date_debut, date_fin,
       session_ref, compte_rendu_ref, lieu_ref, lieu_libelle, format_reunion,
       sous_type_reunion, visio_conference, captation_video, ouverture_presse,
       est_reunion_internationale, date_seance, id_jo, num_seance_jo, quantieme,
       resume_odj, convocation_odj, row_hash, legislature_snapshot
FROM reunions_snapshot
ON CONFLICT (uid) DO UPDATE
    SET type_reunion               = EXCLUDED.type_reunion,
        legislature                = EXCLUDED.legislature,
        organe_uid                 = EXCLUDED.organe_uid,
        etat                       = EXCLUDED.etat,
        date_debut                 = EXCLUDED.date_debut,
        date_fin                   = EXCLUDED.date_fin,
        session_ref                = EXCLUDED.session_ref,
        compte_rendu_ref           = EXCLUDED.compte_rendu_ref,
        lieu_ref                   = EXCLUDED.lieu_ref,
        lieu_libelle               = EXCLUDED.lieu_libelle,
        format_reunion             = EXCLUDED.format_reunion,
        sous_type_reunion          = EXCLUDED.sous_type_reunion,
        visio_conference           = EXCLUDED.visio_conference,
        captation_video            = EXCLUDED.captation_video,
        ouverture_presse           = EXCLUDED.ouverture_presse,
        est_reunion_internationale = EXCLUDED.est_reunion_internationale,
        date_seance                = EXCLUDED.date_seance,
        id_jo                      = EXCLUDED.id_jo,
        num_seance_jo              = EXCLUDED.num_seance_jo,
        quantieme                  = EXCLUDED.quantieme,
        resume_odj                 = EXCLUDED.resume_odj,
        convocation_odj            = EXCLUDED.convocation_odj,
        row_hash                   = EXCLUDED.row_hash,
        legislature_snapshot       = EXCLUDED.legislature_snapshot,
        updated_at                 = now()
WHERE reunions.row_hash != EXCLUDED.row_hash;

-- Une réunion de la législature courante disparue de la source est supprimée
-- (avec ses participants et ses points, par cascade).
DELETE
FROM reunions r
WHERE r.legislature_snapshot IN (SELECT number FROM param_current_legislatures)
  AND NOT EXISTS (SELECT 1 FROM reunions_snapshot s WHERE s.uid = r.uid);

-- =====================================================
-- REUNIONS PARTICIPANTS
-- =====================================================

INSERT INTO reunions_participants (reunion_uid, acteur_uid, presence, row_hash, legislature_snapshot)
SELECT reunion_uid, acteur_uid, presence, row_hash, legislature_snapshot
FROM reunions_participants_snapshot
ON CONFLICT (reunion_uid, acteur_uid) DO UPDATE
    SET presence             = EXCLUDED.presence,
        row_hash             = EXCLUDED.row_hash,
        legislature_snapshot = EXCLUDED.legislature_snapshot,
        updated_at           = now()
WHERE reunions_participants.row_hash != EXCLUDED.row_hash;

DELETE
FROM reunions_participants p
WHERE p.legislature_snapshot IN (SELECT number FROM param_current_legislatures)
  AND NOT EXISTS (SELECT 1
                  FROM reunions_participants_snapshot s
                  WHERE s.reunion_uid = p.reunion_uid
                    AND s.acteur_uid = p.acteur_uid);

-- =====================================================
-- REUNIONS POINTS ODJ
-- =====================================================

INSERT INTO reunions_points_odj (uid, reunion_uid, ordre, type_point, objet, etat, procedure,
                                 nature_travaux, comite_secret, date_conf_pres, row_hash, legislature_snapshot)
SELECT uid, reunion_uid, ordre, type_point, objet, etat, procedure,
       nature_travaux, comite_secret, date_conf_pres, row_hash, legislature_snapshot
FROM reunions_points_odj_snapshot
ON CONFLICT (uid) DO UPDATE
    SET reunion_uid          = EXCLUDED.reunion_uid,
        ordre                = EXCLUDED.ordre,
        type_point           = EXCLUDED.type_point,
        objet                = EXCLUDED.objet,
        etat                 = EXCLUDED.etat,
        procedure            = EXCLUDED.procedure,
        nature_travaux       = EXCLUDED.nature_travaux,
        comite_secret        = EXCLUDED.comite_secret,
        date_conf_pres       = EXCLUDED.date_conf_pres,
        row_hash             = EXCLUDED.row_hash,
        legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE reunions_points_odj.row_hash != EXCLUDED.row_hash;

DELETE
FROM reunions_points_odj p
WHERE p.legislature_snapshot IN (SELECT number FROM param_current_legislatures)
  AND NOT EXISTS (SELECT 1 FROM reunions_points_odj_snapshot s WHERE s.uid = p.uid);

-- =====================================================
-- REUNIONS POINTS ODJ DOSSIERS
-- =====================================================

INSERT INTO reunions_points_odj_dossiers (point_uid, reunion_uid, dossier_uid, row_hash, legislature_snapshot)
SELECT point_uid, reunion_uid, dossier_uid, row_hash, legislature_snapshot
FROM reunions_points_odj_dossiers_snapshot
ON CONFLICT (point_uid, dossier_uid) DO UPDATE
    SET reunion_uid          = EXCLUDED.reunion_uid,
        row_hash             = EXCLUDED.row_hash,
        legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE reunions_points_odj_dossiers.row_hash != EXCLUDED.row_hash;

DELETE
FROM reunions_points_odj_dossiers d
WHERE d.legislature_snapshot IN (SELECT number FROM param_current_legislatures)
  AND NOT EXISTS (SELECT 1
                  FROM reunions_points_odj_dossiers_snapshot s
                  WHERE s.point_uid = d.point_uid
                    AND s.dossier_uid = d.dossier_uid);

COMMIT;
