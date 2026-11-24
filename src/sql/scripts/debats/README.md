# Domaine `debats` — comptes rendus intégraux des séances publiques

Source : jeu open data « Débats » (format Syceron), **XML uniquement**, un fichier par séance,
législatures 16 et 17 :

- `https://data.assemblee-nationale.fr/static/openData/repository/16/vp/syceronbrut/syseron.xml.zip`
- `https://data.assemblee-nationale.fr/static/openData/repository/17/vp/syceronbrut/syseron.xml.zip`

Chaîne : download (`unzip/<leg>/debats/xml/compteRendu/*.xml`) → `DebatsExtractor` (parser, XML lu
avec `fast-xml-parser` puis écrit en JSON-lines comme les autres domaines) → `importDebats.ts`
(raw → snapshot → final). Le parser vide sa mémoire toutes les 100 séances (`debatsFlushEveryFiles`) :
une législature entière tiendrait ~1,3 Go.

## Tables

| Table | Grain | Contenu |
|---|---|---|
| `debats_comptes_rendus` | une séance | `seance_uid` (→ `reunions.uid`, séance publique), date et heure d'ouverture, n° de séance, quantième, session, n° de JO, état |
| `debats_points` | un point de l'ordre du jour | `parent_id` (les points s'imbriquent jusqu'à ~12 niveaux : texte → article → amendement…), profondeur, ordre, titre |
| `debats_interventions` | un paragraphe | point englobant, `ordre` dans la séance, orateur principal (`acteur_uid`), `role_debat` (`president`), `code_grammaire` (nature), texte sans balises, `stime` (position dans la vidéo, s), références d'amendement |
| `debats_interventions_orateurs` | un orateur d'un paragraphe | `acteur_uid` de chaque orateur (un paragraphe peut en compter plusieurs) |

Volumétrie à l'import initial (novembre 2026) :

| | Législature 16 | Législature 17 |
|---|---|---|
| Comptes rendus | 605 | 672 |
| Points | 30 787 | 35 077 |
| Interventions (paragraphes) | 337 041 | 368 625 |
| Orateurs | 312 097 | 334 835 |

Les `id_syceron` (clés des points et interventions) sont uniques d'une législature à l'autre.
Suppression en cascade : compte rendu → points, interventions → orateurs.

## Lire les interventions

- **Un paragraphe n'est pas toujours une prise de parole.** `code_grammaire` en donne la nature :
  `PAROLE_GENERIQUE` (parole), `INTERRUPTION_1_10` (interruption : « Très bien ! », « C'est faux ! » —
  ~85 000 par législature), `DISC_ARTICLES_…` (discussion des articles et amendements),
  `SCRUT_PUB_…` (annonce de scrutin), `SUSP_SEANCE_…`, `OUV_SEAN_…`, `FIN_SEAN_…`… Les paragraphes de
  la présidence de séance portent `role_debat = 'president'`.
- **L'ordre réel dans la séance est `ordre`** (`ordre_absolu_seance`). L'ordre des lignes en sortie du
  parser suit le regroupement par balise de `fast-xml-parser`, pas le document.
- **Orateurs** — `acteur_uid` d'une intervention est l'orateur principal ; il est null quand :
  - le paragraphe a plusieurs orateurs (`id_acteur="PA0"`, ex. interruption commune) : chacun est dans
    `debats_interventions_orateurs` ;
  - l'orateur est collectif (« Plusieurs députés du groupe RN ») ;
  - l'orateur n'a pas de fiche acteur à l'Assemblée : identifiant **négatif** dans la source
    (`PA-125869`) — personnalités auditionnées, ministres non députés (François Bayrou Premier ministre,
    Philippe Tabarot…) ; nom et qualité restent dans `debats_interventions_orateurs`.
  Pour un orateur unique, `id_acteur` et l'identifiant de l'orateur concordent toujours (330 250 / 330 250
  en législature 17).
- **Texte** : balises de mise en forme (`<italique>`, `<exposant>`) retirées, `<br/>` → saut de ligne,
  entités décodées. Les didascalies (« (Applaudissements.) ») restent dans le texte.

## Présence en hémicycle

`debats_interventions_orateurs` est la brique de présence en séance : un député qui parle **ou
interrompt** pendant une séance y est présent. Contrôle croisé avec les questions au Gouvernement :
l'auteur d'une QG a pris la parole dans une séance du jour de la réponse ou de la veille dans 98 % des
cas (1 899 / 1 940 en 16, 1 909 / 1 942 en 17 — voir `date_reponse` dans le README des questions).

Ce n'est qu'une borne basse : un député présent qui ne parle pas n'apparaît pas. À combiner avec les
votes (`votes_deputes`, hors délégation) et les questions orales.

## Anomalies connues de la source

- L'archive 16 contient un compte rendu d'une séance de la **législature 15** (`CRSANR5L16S2021O1N144`,
  1ᵉʳ février 2021, séance `RUANR5L15S2021IDS23666`, 224 interventions) avec un uid et un champ
  `legislature` de la 16. Conservé tel quel ; sa séance est absente de `reunions` (législature 15 non
  importée).
