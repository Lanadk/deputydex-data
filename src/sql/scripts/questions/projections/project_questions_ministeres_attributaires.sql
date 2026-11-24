INSERT INTO questions_ministeres_attributaires_snapshot (question_uid, ordre, ministere_uid, ministere_abrege, date_jo,
                                                         row_hash, legislature_snapshot)
SELECT data ->> 'question_uid',
       (data ->> 'ordre')::integer,
       data ->> 'ministere_uid',
       data ->> 'ministere_abrege',
       (data ->> 'date_jo')::date,
       data ->> 'row_hash',
       (data ->> 'legislature_snapshot')::integer
FROM questions_ministeres_attributaires_raw
ON CONFLICT (question_uid, ordre) DO UPDATE SET ministere_uid        = EXCLUDED.ministere_uid,
                                                ministere_abrege     = EXCLUDED.ministere_abrege,
                                                date_jo              = EXCLUDED.date_jo,
                                                row_hash             = EXCLUDED.row_hash,
                                                legislature_snapshot = EXCLUDED.legislature_snapshot
WHERE questions_ministeres_attributaires_snapshot.row_hash != EXCLUDED.row_hash;
