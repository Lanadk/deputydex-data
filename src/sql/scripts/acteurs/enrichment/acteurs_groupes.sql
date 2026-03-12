-- ============================================================
-- Photo de l'historique des appartenances d'un député à un GP

-- Un député peut appartenir à plusieurs groupes politiques au
-- cours de sa carrière (ex: passer de LR à Renaissance).
-- Chaque appartenance a une date_debut et une date_fin.
-- Si date_fin est NULL, le député est encore dans ce groupe.
--
-- Cette requête récupère tous ces passages dans les groupes
-- politiques depuis la table mandats (qui centralise tous les
-- types de mandats), et les insère dans acteurs_groupes qui
-- est dédiée à cette relation.
--
-- Si un passage existe déjà (même député, même groupe, même
-- date d'entrée), on met à jour la date de sortie au cas où
-- elle aurait changé (ex: données mises à jour depuis l'AN).
-- ============================================================
INSERT INTO acteurs_groupes (acteur_uid, groupe_id, groupe_legislature, date_debut, date_fin, legislature_snapshot, row_hash)
-- Étape 1 : Extraction des mandats GP depuis la table mandats
-- DISTINCT ON (acteur_uid, organe_uid, date_debut) : on garde une seule
-- ligne par combinaison acteur + groupe + date_debut.
-- Le ORDER BY avec date_fin NULLS LAST permet de prioriser les lignes
-- avec date_fin NULL (groupe encore actif) sur celles avec une date_fin.
WITH mandats_gp AS (
    SELECT DISTINCT ON (acteur_uid, organe_uid, date_debut)
        acteur_uid,
        organe_uid          AS groupe_id,
        legislature         AS groupe_legislature,
        date_debut,
        date_fin,
        legislature_snapshot,
        row_hash
    FROM mandats
    WHERE type_organe = 'GP'
      -- Filtre uniquement les législatures configurées dans param_legislatures
      AND legislature IN (SELECT number FROM param_legislatures)
    ORDER BY acteur_uid, organe_uid, date_debut, date_fin NULLS LAST
)
SELECT * FROM mandats_gp
-- Étape 2 : Upsert — si la combinaison (acteur, groupe, date_debut)
-- existe déjà, on met à jour date_fin et les métadonnées.
-- On ne touche pas à acteur_uid, groupe_id, date_debut (clé de conflit).
ON CONFLICT (acteur_uid, groupe_id, date_debut) DO UPDATE SET
                                                              date_fin             = EXCLUDED.date_fin,
                                                              legislature_snapshot = EXCLUDED.legislature_snapshot,
                                                              row_hash             = EXCLUDED.row_hash;