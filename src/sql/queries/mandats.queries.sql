-- Durée de chaque mandat / depute / legislature (base simple)
SELECT
    m.acteur_uid,
    a.prenom,
    a.nom,
    m.uid AS mandat_uid,
    m.legislature,
    m.date_debut,
    m.date_fin,
    AGE(COALESCE(m.date_fin, CURRENT_DATE), m.date_debut) AS duree_mandat
FROM mandats m
         JOIN acteurs a ON a.uid = m.acteur_uid
WHERE m.type_organe = 'ASSEMBLEE'
ORDER BY m.acteur_uid, m.date_debut;

-- Détecter les mandats successifs (sans interruption)
WITH mandats_ordonnes AS (
    SELECT
        m.*,
        LAG(m.date_fin) OVER (
            PARTITION BY m.acteur_uid
            ORDER BY m.date_debut
            ) AS date_fin_precedente
    FROM mandats m
    WHERE m.type_organe = 'ASSEMBLEE'
),
     groupes AS (
         SELECT *,
                CASE
                    WHEN date_fin_precedente IS NULL
                        OR date_debut > date_fin_precedente + INTERVAL '1 day'
    THEN 1
    ELSE 0
END AS rupture
         FROM mandats_ordonnes
     ),
     groupes_cumules AS (
         SELECT *,
                SUM(rupture) OVER (
                    PARTITION BY acteur_uid
                    ORDER BY date_debut
                    ) AS groupe_mandat
         FROM groupes
     )
SELECT
    acteur_uid,
    MIN(date_debut) AS debut_sequence,
    MAX(COALESCE(date_fin, CURRENT_DATE)) AS fin_sequence,
    AGE(MAX(COALESCE(date_fin, CURRENT_DATE)),
        MIN(date_debut)) AS duree_sequence
FROM groupes_cumules
GROUP BY acteur_uid, groupe_mandat
ORDER BY acteur_uid, debut_sequence;


--Durée totale cumulée par député (toutes séquences confondues)

SELECT
    acteur_uid,
    SUM(
            COALESCE(date_fin, CURRENT_DATE) - date_debut
    ) AS total_jours_mandat
FROM mandats
WHERE type_organe = 'ASSEMBLEE'
GROUP BY acteur_uid
ORDER BY total_jours_mandat DESC;

--- Par legislature
-- Durée par député dans chaque législature
SELECT
    m.acteur_uid,
    a.prenom,
    a.nom,
    m.legislature,
    MIN(m.date_debut) AS debut_dans_legislature,
    MAX(COALESCE(m.date_fin, CURRENT_DATE)) AS fin_dans_legislature,
    AGE(
            MAX(COALESCE(m.date_fin, CURRENT_DATE)),
            MIN(m.date_debut)
    ) AS duree_dans_legislature,
    SUM(
            COALESCE(m.date_fin, CURRENT_DATE) - m.date_debut
    ) AS total_jours_legislature
FROM mandats m
         JOIN acteurs a ON a.uid = m.acteur_uid
WHERE m.type_organe = 'ASSEMBLEE'
GROUP BY
    m.acteur_uid,
    a.prenom,
    a.nom,
    m.legislature
ORDER BY
    m.legislature,
    total_jours_legislature DESC;

-- Durée totale par législature (tous députés)
SELECT
    m.legislature,
    SUM(
            COALESCE(m.date_fin, CURRENT_DATE) - m.date_debut
    ) AS total_jours_mandats
FROM mandats m
WHERE m.type_organe = 'ASSEMBLEE'
GROUP BY m.legislature
ORDER BY m.legislature;

-- Nbr de jours / depute / legislature
WITH bornes AS (
    SELECT
        m.acteur_uid,
        m.legislature,
        GREATEST(m.date_debut, pl.start_date) AS debut_corrige,
        LEAST(
                COALESCE(m.date_fin, CURRENT_DATE),
                pl.end_date
        ) AS fin_corrige
    FROM mandats m
             JOIN param_legislatures pl
                  ON pl.number = m.legislature
    WHERE m.type_organe = 'ASSEMBLEE'
)
SELECT
    acteur_uid,
    legislature,
    SUM(fin_corrige - debut_corrige) AS jours_dans_legislature
FROM bornes
GROUP BY acteur_uid, legislature
ORDER BY legislature, jours_dans_legislature DESC;