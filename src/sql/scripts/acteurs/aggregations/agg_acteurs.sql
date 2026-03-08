-- ============================================================
-- VIEW : agg_acteurs_stats_professions
-- ============================================================
-- Répartition des députés par catégorie et famille de profession
-- pour chaque législature.
--
-- Logique de filtrage des mandats :
--   - Legislature courante : uniquement les mandats actifs (date_fin IS NULL)
--   - Legislatures archivées : tous les députés ayant siégé
--
-- Colonnes :
--   - legislature         : numéro de la législature
--   - profession_categorie : catégorie socioprofessionnelle INSEE
--   - profession_famille  : famille socioprofessionnelle INSEE
--   - nb_acteurs          : nombre de députés pour cette profession
--   - total_legislature   : total des députés de la législature (pour % côté front)
--
-- Usage : graphiques de répartition socioprofessionnelle par législature
-- ============================================================
CREATE MATERIALIZED VIEW agg_acteurs_stats_professions AS
SELECT m.legislature,
       m.type_organe,
       a.profession_categorie,
       a.profession_famille,
       COUNT(DISTINCT a.uid) as nb_acteurs,
       SUM(COUNT(DISTINCT a.uid)) OVER (
           PARTITION BY m.legislature, m.type_organe
           )                 as total_legislature,
       ROUND(
               COUNT(DISTINCT a.uid)::numeric * 100 /
               SUM(COUNT(DISTINCT a.uid)) OVER (
                   PARTITION BY m.legislature, m.type_organe
                   ), 2
       )                     as pourcentage
FROM acteurs a
         INNER JOIN mandats m ON m.acteur_uid = a.uid
    AND (
                                     m.date_fin IS NULL -- mandat en cours (leg courante)
                                         OR
                                     m.legislature !=
                                     (SELECT number FROM param_current_legislatures) -- pour les legs archivées : prendre tous les mandats de la leg
                                     )
WHERE a.profession_categorie IS NOT NULL
GROUP BY m.legislature, m.type_organe, a.profession_categorie, a.profession_famille;

-- ============================================================
-- VIEW : agg_acteurs_stats_genre
-- ============================================================
-- Répartition H/F des députés par législature et type d'organe
--
-- Logique de filtrage des mandats :
--   - Legislature courante : uniquement les mandats actifs (date_fin IS NULL)
--   - Legislatures archivées : tous les députés ayant siégé
--
-- Colonnes :
--   - legislature       : numéro de la législature
--   - type_organe       : type d'organe parlementaire
--   - genre             : 'H' ou 'F' dérivé de la civilité
--   - nb_acteurs        : nombre de députés pour ce genre
--   - total_legislature : total des députés (pour % côté front)
-- ============================================================
CREATE MATERIALIZED VIEW agg_acteurs_stats_genre AS
SELECT m.legislature,
       m.type_organe,
       CASE
           WHEN a.civilite = 'M.' THEN 'H'
           WHEN a.civilite = 'Mme' THEN 'F'
           ELSE 'Inconnu'
           END               as genre,
       COUNT(DISTINCT a.uid) as nb_acteurs,
       SUM(COUNT(DISTINCT a.uid)) OVER (
           PARTITION BY m.legislature, m.type_organe
           )                 as total_legislature,
       ROUND(
               COUNT(DISTINCT a.uid)::numeric * 100 /
               SUM(COUNT(DISTINCT a.uid)) OVER (
                   PARTITION BY m.legislature, m.type_organe
                   ), 2
       )                     as pourcentage
FROM acteurs a
         INNER JOIN mandats m ON m.acteur_uid = a.uid
    AND (
                                     m.date_fin IS NULL -- mandat en cours (leg courante)
                                         OR
                                     m.legislature !=
                                     (SELECT number FROM param_current_legislatures) -- pour les legs archivées : prendre tous les mandats de la leg
                                     )
GROUP BY m.legislature, m.type_organe, genre;


-- ============================================================
-- VIEW : agg_acteurs_stats_age
-- ============================================================
-- Répartition des députés par tranche d'âge, législature et type d'organe
--
-- Logique de filtrage des mandats :
--   - Legislature courante : uniquement les mandats actifs (date_fin IS NULL)
--   - Legislatures archivées : tous les députés ayant siégé
--
-- Colonnes :
--   - legislature       : numéro de la législature
--   - type_organe       : type d'organe parlementaire
--   - tranche_age       : tranche d'âge (<30, 30-39, 40-49, 50-59, 60-69, 70+)
--   - nb_acteurs        : nombre de députés pour cette tranche
--   - total_legislature : total des députés (pour % côté front)
-- ============================================================
CREATE MATERIALIZED VIEW agg_acteurs_stats_age AS
SELECT m.legislature,
       m.type_organe,
       CASE
           WHEN EXTRACT(YEAR FROM AGE(a.date_naissance::date)) < 30 THEN '<30'
           WHEN EXTRACT(YEAR FROM AGE(a.date_naissance::date)) < 40 THEN '30-39'
           WHEN EXTRACT(YEAR FROM AGE(a.date_naissance::date)) < 50 THEN '40-49'
           WHEN EXTRACT(YEAR FROM AGE(a.date_naissance::date)) < 60 THEN '50-59'
           WHEN EXTRACT(YEAR FROM AGE(a.date_naissance::date)) < 70 THEN '60-69'
           ELSE '70+'
           END               as tranche_age,
       COUNT(DISTINCT a.uid) as nb_acteurs,
       SUM(COUNT(DISTINCT a.uid)) OVER (
           PARTITION BY m.legislature, m.type_organe
           )                 as total_legislature,
       ROUND(
               COUNT(DISTINCT a.uid)::numeric * 100 /
               SUM(COUNT(DISTINCT a.uid)) OVER (
                   PARTITION BY m.legislature, m.type_organe
                   ), 2
       )                     as pourcentage
FROM acteurs a
         INNER JOIN mandats m ON m.acteur_uid = a.uid
    AND (
                                     m.date_fin IS NULL -- mandat en cours (leg courante)
                                         OR
                                     m.legislature !=
                                     (SELECT number FROM param_current_legislatures) -- pour les legs archivées : prendre tous les mandats de la leg
                                     )
WHERE a.date_naissance IS NOT NULL
GROUP BY m.legislature, m.type_organe, tranche_age;

-- ============================================================
-- VIEW : agg_acteurs_stats_geographie_election
-- ============================================================
-- Répartition des députés par département et région d'élection
-- pour chaque législature et type d'organe.
--
-- Logique de filtrage des mandats :
--   - Legislature courante : uniquement les mandats actifs (date_fin IS NULL)
--   - Legislatures archivées : tous les députés ayant siégé
--   - type_organe : pas de filtre, tous les organes sont inclus
--                   le filtrage se fait côté front selon le contexte
--
-- Colonnes :
--   - legislature            : numéro de la législature
--   - type_organe            : type d'organe parlementaire
--   - election_region        : région d'élection
--   - election_region_type   : type de région
--   - election_departement   : département d'élection
--   - nb_acteurs             : nombre de députés pour ce territoire
--   - total_legislature      : total des députés de la législature
--   - pourcentage            : part en % sur le total de la législature
--
-- Usage : carte des circonscriptions, répartition territoriale
-- ============================================================
CREATE MATERIALIZED VIEW agg_acteurs_stats_geographie_election AS
SELECT m.legislature,
       m.type_organe,
       m.election_region,
       m.election_region_type,
       m.election_departement,
       COUNT(DISTINCT a.uid) as nb_acteurs,
       SUM(COUNT(DISTINCT a.uid)) OVER (
           PARTITION BY m.legislature, m.type_organe
           )                 as total_legislature,
       ROUND(
               COUNT(DISTINCT a.uid)::numeric * 100 /
               SUM(COUNT(DISTINCT a.uid)) OVER (
                   PARTITION BY m.legislature, m.type_organe
                   ), 2
       )                     as pourcentage
FROM acteurs a
         INNER JOIN mandats m ON m.acteur_uid = a.uid
    AND (
                                     m.date_fin IS NULL -- mandat en cours (leg courante)
                                         OR
                                     m.legislature !=
                                     (SELECT number FROM param_current_legislatures) -- pour les legs archivées : prendre tous les mandats de la leg
                                     )
WHERE m.election_departement IS NOT NULL
GROUP BY m.legislature, m.type_organe, m.election_region, m.election_region_type, m.election_departement;

-- ============================================================
-- VIEW : agg_acteurs_stats_geographie_naissance
-- ============================================================
-- Répartition des députés par département et pays de naissance
-- pour chaque législature et type d'organe.
--
-- Logique de filtrage des mandats :
--   - Legislature courante : uniquement les mandats actifs (date_fin IS NULL)
--   - Legislatures archivées : tous les députés ayant siégé
--   - type_organe : pas de filtre, tous les organes sont inclus
--                   le filtrage se fait côté front selon le contexte
--
-- Colonnes :
--   - legislature              : numéro de la législature
--   - type_organe              : type d'organe parlementaire
--   - pays_naissance           : pays de naissance
--   - departement_naissance    : département de naissance
--   - nb_acteurs               : nombre de députés pour cette origine
--   - total_legislature        : total des députés de la législature
--   - pourcentage              : part en % sur le total de la législature
--
-- Usage : origine géographique des députés, diversité territoriale
-- ============================================================
CREATE MATERIALIZED VIEW agg_acteurs_stats_geographie_naissance AS
SELECT m.legislature,
       m.type_organe,
       a.pays_naissance,
       a.departement_naissance,
       COUNT(DISTINCT a.uid) as nb_acteurs,
       SUM(COUNT(DISTINCT a.uid)) OVER (
           PARTITION BY m.legislature, m.type_organe
           )                 as total_legislature,
       ROUND(
               COUNT(DISTINCT a.uid)::numeric * 100 /
               SUM(COUNT(DISTINCT a.uid)) OVER (
                   PARTITION BY m.legislature, m.type_organe
                   ), 2
       )                     as pourcentage
FROM acteurs a
         INNER JOIN mandats m ON m.acteur_uid = a.uid
    AND (
                                     m.date_fin IS NULL -- mandat en cours (leg courante)
                                         OR
                                     m.legislature !=
                                     (SELECT number FROM param_current_legislatures) -- pour les legs archivées : prendre tous les mandats de la leg
                                     )
WHERE a.pays_naissance IS NOT NULL
GROUP BY m.legislature, m.type_organe, a.pays_naissance, a.departement_naissance;