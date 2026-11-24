# Domaine `reunions` — agenda et présences en commission

Source : jeu open data « Réunions » de l'Assemblée nationale (`Agenda.json.zip`, un fichier JSON par
réunion), déclaré dans `param_data_sources` pour les législatures 16 et 17 :

- `https://data.assemblee-nationale.fr/static/openData/repository/16/vp/reunions/Agenda.json.zip`
- `https://data.assemblee-nationale.fr/static/openData/repository/17/vp/reunions/Agenda.json.zip`

Chaîne : download (`unzip/<leg>/reunions/json/reunion/*.json`) → `ReunionsExtractor` (parser) →
`importReunions.ts` (raw → snapshot → final).

## Tables

| Table | Contenu |
|---|---|
| `reunions` | Une réunion : type (`commission`, `seance`, `init_parlementaire`), organe, dates, état (`Confirmé`, `Annulé`, `Eventuel`, `Supprimé`), lieu, visio, captation, ouverture presse, résumé/convocation de l'ordre du jour, identifiants JO (séances), `compte_rendu_ref`. |
| `reunions_participants` | Liste de présence : (réunion, député) → `présent` / `absent` / `excusé`. |
| `reunions_points_odj` | Points de l'ordre du jour (type, objet, état, procédure, comité secret…). |
| `reunions_points_odj_dossiers` | Lien point de l'ordre du jour → dossier législatif. |

Réunions à l'initiative d'un parlementaire (`type_reunion = 'init_parlementaire'`), selon
`sous_type_reunion` :

| Sous-type | Signification | `organe_uid` | Demandeur |
|---|---|---|---|
| `GE` | groupe d'études | l'organe du groupe | — |
| `GP` | groupe politique (6 réunions, législature 16) | l'organe du groupe | `demandeur_organe_uid` |
| `DEP` | député (993 réunions, législature 16 uniquement) | **null** | `demandeur_acteur_uid` |

`organe_uid` est donc nullable : une réunion `DEP` n'est rattachée à aucun organe, c'est le député
demandeur qui l'identifie. Ces réunions n'ont jamais de liste de présence.

Pas de clé étrangère vers `organes`, `acteurs` ni `dossier_parlementaire` : une réunion peut viser un
organe ou un dossier absent des archives importées (organes du Sénat pour les réunions communes,
organes d'une autre législature…). Les participants, points et liens dossiers sont supprimés en
cascade avec leur réunion.

Volumétrie à l'import initial (novembre 2026) :

| | Législature 16 | Législature 17 |
|---|---|---|
| Réunions | 8 320 | 8 480 |
| Lignes de présence | 138 937 | 194 924 |
| Points de l'ordre du jour | 4 337 | 6 676 |
| Liens dossiers | 2 465 | 3 384 |

Les deux archives sont disjointes (16 800 réunions au total = 8 320 + 8 480). La colonne
`legislature` vient de l'uid de la réunion et peut différer de la législature de l'archive
(`legislature_snapshot`) : l'archive 16 contient des uids `RUANR5L15…` (réunions programmées avant
l'ouverture de la 16), l'archive 17 des uids `RUANR5L16…`. Si une réunion figurait un jour dans les
deux archives, la législature importée en dernier (17) l'emporterait.

## Sémantique de la liste de présence — à lire avant tout calcul de taux

### D'où vient la liste

L'open data **reconstruit** la liste à partir du compte rendu publié de la réunion. Ce compte rendu
ne contient que trois sections, en fin de document (« Membres présents ou excusés ») :

| Section du compte rendu | Statut dans l'open data |
|---|---|
| « Présents » | `présent` |
| « Excusés » | `excusé` |
| « Assistaient également à la réunion » (députés présents qui ne siègent pas comme membres) | `présent` |
| *(membre de l'organe cité nulle part)* | `absent` |

Conséquences :

- **`absent` est une déduction, pas un pointage.** Aucun compte rendu ne liste d'absents.
- **`présent` mélange membres et non-membres.** Rien dans l'open data ne distingue un membre présent
  d'un député venu « assister également ». Sur la législature 17, 6,4 % des `présent` (4 796 / 74 605)
  concernent un député sans mandat actif dans l'organe ce jour-là (contre 0,6 % des `absent` et 0,3 %
  des `excusé`).

### Doublons dans une même réunion

Un même député apparaît parfois deux fois dans la liste d'une réunion (32 cas sur la législature 17,
toujours sur deux lignes adjacentes, la liste étant triée par nom) :

| Combinaison | Cas |
|---|---|
| présent + présent | 11 |
| présent + absent (dans un ordre ou l'autre) | 21 |
| avec « excusé » | 0 |

Cause, vérifiée sur les comptes rendus publiés : le député est rattaché à l'organe (donc `absent`
faute d'apparaître dans « Présents » ou « Excusés ») **et** cité dans « Assistaient également à la
réunion » (donc `présent`). Cas vérifiés :

- Commission des finances, 30/10/2024 à 21 h (compte rendu n° 35, `CRCANR5L17S2025PO59048N035`) :
  Didier Padey n'est cité que dans « Assistaient également » et intervient plusieurs fois en séance.
- Commission de la défense, 20/11/2024 à 11 h (compte rendu n° 24, `CRCANR5L17S2025PO59046N024`) :
  Corinne Vignon n'est citée que dans « Assistait également » et intervient ; elle n'a aucun mandat
  actif dans la commission ce jour-là.

Le phénomène est lié aux **remplacements temporaires en commission** : les groupes font entrer et
sortir leurs députés des commissions au jour le jour (des dizaines de mandats `Membre` d'un seul jour
dans les données AMO), et le secrétariat classe alors le député sous « Assistaient également ».

Règle appliquée par `ReunionsExtractor` : une seule ligne par (réunion, député), avec le statut le plus
fort (`présent` > `excusé` > `absent`). Les doublons `présent + présent` (non vérifiés un à un)
relèvent très probablement du même mécanisme.

### Couverture

Les listes de présence n'existent que pour certaines réunions (réunions de commission confirmées et
passées, législature 17) :

| Type d'organe | Réunions | Avec liste |
|---|---|---|
| Commissions permanentes (`COMPER`) | 1 832 | 1 821 |
| Commissions d'enquête (`CNPE`) | 836 | 821 |
| Groupes d'amitié (`GA`) | 447 | 444 |
| Délégations (`DELEG`) | 142 | 138 |
| Missions d'information (`MISINFO`, `MISINFOCOM`) | 1 371 | 0 |
| Assemblées parlementaires internationales (`API`) | 49 | 0 |

**Les séances publiques n'ont jamais de liste de présence.** La présence en hémicycle se mesure par
les votes (`votes_deputes`) et, plus tard, par les interventions dans les débats (pont :
`reunions.compte_rendu_ref`).

### Recommandations pour les agrégats de présence

- **Dénominateur = mandats, pas la liste brute.** Pour un député, les réunions attendues sont celles
  des organes dont il est membre à la date de la réunion (`mandats.organe_uid`, `date_debut`,
  `date_fin`), restreintes aux réunions qui **ont** une liste de présence et à l'état `Confirmé`.
  Sinon les missions d'information sans liste comptent comme des absences.
- **Présences hors mandat à part.** Un `présent` sans mandat actif dans l'organe est une présence
  volontaire (« Assistaient également ») : à compter comme de l'activité, pas dans le taux de présence
  du membre.
- **`excusé` est distinct de `absent`** et doit rester visible dans les agrégats.
- Un député convoqué dans plusieurs organes qui siègent en même temps est mécaniquement absent de
  certains : à garder en tête avant de présenter un taux brut.
