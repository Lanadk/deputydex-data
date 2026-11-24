INSERT INTO reunions_points_odj_snapshot (uid, reunion_uid, ordre, type_point, objet, etat, procedure,
                                          nature_travaux, comite_secret, date_conf_pres, row_hash,
                                          legislature_snapshot)
SELECT data ->> 'uid',
       data ->> 'reunion_uid',
       (data ->> 'ordre')::integer,
       data ->> 'type_point',
       data ->> 'objet',
       data ->> 'etat',
       data ->> 'procedure',
       data ->> 'nature_travaux',
       (data ->> 'comite_secret')::boolean,
       (data ->> 'date_conf_pres')::date,
       data ->> 'row_hash',
       (data ->> 'legislature_snapshot')::integer
FROM reunions_points_odj_raw
ON CONFLICT (uid) DO UPDATE SET reunion_uid          = EXCLUDED.reunion_uid,
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
WHERE reunions_points_odj_snapshot.row_hash != EXCLUDED.row_hash;
