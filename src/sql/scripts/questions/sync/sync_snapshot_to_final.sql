BEGIN;

-- Les questions sont synchronisées en premier : les ministères attributaires
-- les référencent (clé étrangère ON DELETE CASCADE).

-- =====================================================
-- QUESTIONS
-- =====================================================

INSERT INTO questions (uid, type_question, legislature, numero, acteur_uid, mandat_uid, groupe_uid, groupe_abrege,
                       rubrique, tete_analyse, libelle_analyse, ministere_uid, ministere_abrege, date_question,
                       texte_question, date_reponse, type_jo_reponse, page_jo_reponse, texte_reponse, code_cloture,
                       libelle_cloture, date_cloture, nb_renouvellements, date_dernier_renouvellement,
                       date_signalement, row_hash, legislature_snapshot)
SELECT uid, type_question, legislature, numero, acteur_uid, mandat_uid, groupe_uid, groupe_abrege,
       rubrique, tete_analyse, libelle_analyse, ministere_uid, ministere_abrege, date_question,
       texte_question, date_reponse, type_jo_reponse, page_jo_reponse, texte_reponse, code_cloture,
       libelle_cloture, date_cloture, nb_renouvellements, date_dernier_renouvellement,
       date_signalement, row_hash, legislature_snapshot
FROM questions_snapshot
ON CONFLICT (uid) DO UPDATE
    SET type_question               = EXCLUDED.type_question,
        legislature                 = EXCLUDED.legislature,
        numero                      = EXCLUDED.numero,
        acteur_uid                  = EXCLUDED.acteur_uid,
        mandat_uid                  = EXCLUDED.mandat_uid,
        groupe_uid                  = EXCLUDED.groupe_uid,
        groupe_abrege               = EXCLUDED.groupe_abrege,
        rubrique                    = EXCLUDED.rubrique,
        tete_analyse                = EXCLUDED.tete_analyse,
        libelle_analyse             = EXCLUDED.libelle_analyse,
        ministere_uid               = EXCLUDED.ministere_uid,
        ministere_abrege            = EXCLUDED.ministere_abrege,
        date_question               = EXCLUDED.date_question,
        texte_question              = EXCLUDED.texte_question,
        date_reponse                = EXCLUDED.date_reponse,
        type_jo_reponse             = EXCLUDED.type_jo_reponse,
        page_jo_reponse             = EXCLUDED.page_jo_reponse,
        texte_reponse               = EXCLUDED.texte_reponse,
        code_cloture                = EXCLUDED.code_cloture,
        libelle_cloture             = EXCLUDED.libelle_cloture,
        date_cloture                = EXCLUDED.date_cloture,
        nb_renouvellements          = EXCLUDED.nb_renouvellements,
        date_dernier_renouvellement = EXCLUDED.date_dernier_renouvellement,
        date_signalement            = EXCLUDED.date_signalement,
        row_hash                    = EXCLUDED.row_hash,
        legislature_snapshot        = EXCLUDED.legislature_snapshot,
        updated_at                  = now()
WHERE questions.row_hash != EXCLUDED.row_hash;

-- Une question de la législature courante disparue de la source est supprimée
-- (avec ses ministères attributaires, par cascade).
DELETE
FROM questions q
WHERE q.legislature_snapshot IN (SELECT number FROM param_current_legislatures)
  AND NOT EXISTS (SELECT 1 FROM questions_snapshot s WHERE s.uid = q.uid);

-- =====================================================
-- QUESTIONS MINISTERES ATTRIBUTAIRES
-- =====================================================

INSERT INTO questions_ministeres_attributaires (question_uid, ordre, ministere_uid, ministere_abrege, date_jo,
                                                row_hash, legislature_snapshot)
SELECT question_uid, ordre, ministere_uid, ministere_abrege, date_jo, row_hash, legislature_snapshot
FROM questions_ministeres_attributaires_snapshot
ON CONFLICT (question_uid, ordre) DO UPDATE
    SET ministere_uid        = EXCLUDED.ministere_uid,
        ministere_abrege     = EXCLUDED.ministere_abrege,
        date_jo              = EXCLUDED.date_jo,
        row_hash             = EXCLUDED.row_hash,
        legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE questions_ministeres_attributaires.row_hash != EXCLUDED.row_hash;

DELETE
FROM questions_ministeres_attributaires m
WHERE m.legislature_snapshot IN (SELECT number FROM param_current_legislatures)
  AND NOT EXISTS (SELECT 1
                  FROM questions_ministeres_attributaires_snapshot s
                  WHERE s.question_uid = m.question_uid
                    AND s.ordre = m.ordre);

COMMIT;
