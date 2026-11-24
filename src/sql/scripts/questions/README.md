# Domaine `questions` — questions au Gouvernement, orales sans débat et écrites

Sources : trois jeux open data de l'Assemblée nationale, un par type de question, au même format
JSON (un fichier par question, racine `question`, type dans `question.type`). Législatures 16 et 17 :

| Domaine de téléchargement | Archive | Type |
|---|---|---|
| `questions_gouvernement` | `…/<leg>/questions/questions_gouvernement/Questions_gouvernement.json.zip` | `QG` |
| `questions_orales_sans_debat` | `…/<leg>/questions/questions_orales_sans_debat/Questions_orales_sans_debat.json.zip` | `QOSD` |
| `questions_ecrites` | `…/<leg>/questions/questions_ecrites/Questions_ecrites.json.zip` | `QE` |

(préfixe `https://data.assemblee-nationale.fr/static/openData/repository`)

Trois domaines de téléchargement parce que `param_data_sources` est unique par (domaine,
législature). Le parser les lit ensemble dans un seul domaine `questions` (`QuestionsExtractor`,
répertoires `unzip/<leg>/<domaine>/json`, un répertoire manquant fait échouer le parsing), importé
par `importQuestions.ts` (raw → snapshot → final).

## Tables

| Table | Contenu |
|---|---|
| `questions` | Une question : type, auteur (`acteur_uid`, mandat, groupe au moment de la question), indexation (rubrique, `libelle_analyse`), ministère interrogé, texte et date de la question, réponse (date, type de JO, page, texte), clôture, renouvellements et signalement (QE). |
| `questions_ministeres_attributaires` | Ministères successifs auxquels la question a été attribuée (réattributions, changements de gouvernement), `ordre` = rang dans la source. |

Pas de clé étrangère vers `acteurs`, `organes` (groupe, ministères) : ces organes peuvent manquer des
archives importées. Les ministères attributaires sont supprimés en cascade avec leur question.

`libelle_analyse` porte l'« analyse » AN (intitulé court de la question) : `analyse` est un mot réservé
PostgreSQL.

Volumétrie à l'import initial (novembre 2026) :

| Législature | Type | Questions | Réponse publiée | En attente | Autre clôture |
|---|---|---|---|---|---|
| 16 | QG | 1 940 | 1 940 | 0 | 0 |
| 16 | QOSD | 833 | 739 | 0 | 94 |
| 16 | QE | 18 710 | 11 708 | 0 | 7 002 |
| 17 | QG | 1 942 | 1 942 | 0 | 0 |
| 17 | QOSD | 863 | 815 | 37 | 11 |
| 17 | QE | 19 967 | 12 867 | 6 481 | 619 |

Codes de clôture rencontrés : `REP_PUB` (réponse publiée), `AU` (retrait à l'initiative de
l'auteur), `FM` (fin de mandat — massif en 16 avec la dissolution), `ID` (question identique),
`ANSE` (séance de QOSD annulée).

## Ce que chaque type dit de l'activité et de la présence du député

| Type | Où | Preuve de présence en séance ? |
|---|---|---|
| `QG` | posée en séance (mardi, mercredi), réponse au JO des débats | **oui** : l'auteur prend la parole (transcription dans `texte_reponse`) |
| `QOSD` | posée en séance, réponse au JO des débats | **oui en pratique** : 4 QOSD sur 815 (législature 17) ont été posées par un suppléant (« La parole est à M. X, suppléant Mme Y ») |
| `QE` | déposée et répondue par écrit, au JO des questions | **non** : activité, pas présence |

Les QG n'ont pas de `texte_question` ni de `date_question` : la question est posée directement en
séance, son texte est dans la transcription de la réponse.

### `date_reponse` n'est pas toujours la date de la séance

`date_reponse` est la date du **JO** qui publie la réponse. Pour les QG et QOSD, c'est en général le
jour de la séance, mais pas toujours (contrôle contre les séances publiques de `reunions`) :

| Législature | Type | Réponses en séance | Une séance confirmée ce jour-là |
|---|---|---|---|
| 16 | QG | 1 940 | 1 827 |
| 16 | QOSD | 739 | 739 |
| 17 | QG | 1 942 | 1 802 |
| 17 | QOSD | 815 | 814 |

Les QG sans séance le jour même tiennent sur une douzaine de dates (une séance de questions entière
à chaque fois) et ont presque toutes une séance confirmée **la veille** : le JO a paru le lendemain.
Pour rattacher une question à sa séance, tolérer un jour d'écart, ou passer par les débats (comptes
rendus Syceron) une fois importés.
