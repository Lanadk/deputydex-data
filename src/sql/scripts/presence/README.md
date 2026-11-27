# Domaine `presence` — taux de présence des députés

Calcule un **taux de présence** par député, par groupe politique et pour toute l'Assemblée, sur la législature
et mois par mois (issue front Lanadk/deputydex#103). Il n'existe pas de taux de présence officiel : chaque source
ne voit qu'une partie de l'activité. La démarche consiste donc à **observer la présence jour par jour, source par
source, puis à consolider**, en gardant chaque étape lisible et vérifiable.

## Démarche en trois couches

```
 SOURCES (tables importées)          BRIQUES PAR SOURCE (vues, un domaine chacune)       CONSOLIDATION (domaine presence)
 ───────────────────────────         ─────────────────────────────────────────────       ────────────────────────────────
 reunions + reunions_participants ─▶ mv_reunions_presence_jour   (commissions)   ─┐
 votes_deputes + scrutins         ─▶ mv_scrutins_presence_jour   (votes)          │
 scrutins                         ─▶ mv_scrutins_jours           (scrutins/jour)  ├─▶ mv_deputes_presence_jour ─▶ agg_deputes_presence(_mensuelle)
 debats_* (comptes rendus)        ─▶ mv_debats_presence_jour     (prises parole)  │   (député × jour)            agg_groupes_presence(_mensuelle)
 debats_comptes_rendus            ─▶ mv_debats_seances_jours     (séances tenues)─┘                              agg_assemblee_presence(_mensuelle)
                                                                                                                 (+ variantes _annuelle)
 mandats (ASSEMBLEE, GP, organes) ───────────────────────────────────────────────────▲ (période de mandat, groupe du jour, membre d'un organe)
```

1. **Briques par source** — chaque vue répond à une seule question, dans le domaine de sa source
   (`sql/scripts/{reunions,scrutins,debats}/aggregations/`) : qui était en commission tel jour, qui a voté
   personnellement tel jour, qui a parlé en séance tel jour, quels jours une séance s'est tenue ou des scrutins
   ont eu lieu.
2. **Consolidation journalière** — `mv_deputes_presence_jour` (une ligne par député et par jour) croise les
   briques avec les mandats : le député était-il attendu ce jour-là, était-il présent, et par quelle source.
3. **Taux** — les vues `agg_*_presence*` ne font qu'agréger la vue journalière (par député, groupe, Assemblée ;
   sur la législature ou par mois). Le front les lit par simple lookup sur leurs clés.

## Règles

| Notion | Règle |
|---|---|
| Période de mandat | mandats `ASSEMBLEE` (prise de fonction → fin de mandat). Un député devenu ministre n'est plus attendu. |
| Jour de séance | une séance publique s'est **réellement tenue** : compte rendu publié ou au moins un scrutin public (pas l'agenda). |
| Séance observable | jour de séance **avec au moins un scrutin public**. |
| Jour attendu | séance observable pendant le mandat, **ou** convocation (membre de l'organe à cette date, d'après `mandats`) à une réunion à liste de présence. |
| Présent en séance | au moins un vote **personnel** (pour / contre / abstention, **hors délégation**), une prise de parole, une interruption ou une présidence de séance. |
| Présent en commission | noté présent à une réunion confirmée et déjà tenue (membre ou non). |
| Jour présent | présent en séance ou en commission. |
| **Taux de présence** | jours présents ÷ jours attendus. |
| Groupe | mandat `GP` du député **ce jour-là** : un député qui change de groupe compte pour chacun sur sa période. |
| Groupe, Assemblée | taux **pondérés** : somme des jours présents ÷ somme des jours attendus (pas la moyenne des taux individuels). |

Composantes publiées à côté du taux principal (mêmes colonnes dans toutes les vues `agg_*_presence*`) :

- `taux_presence_seance` : jours de séance observables où il est présent en séance ;
- `taux_presence_commission` / `taux_excuses_commission` : présences / excuses parmi ses convocations ;
- `taux_participation_scrutins` : votes personnels parmi les scrutins publics de ses jours de mandat ;
- `jours_presence_non_attendus` : présences un jour où il n'était pas attendu (prise de parole un jour sans
  scrutin, réunion d'un organe dont il n'est pas membre) — non comptées dans le taux ;
- `effectif_moyen` (groupes, Assemblée) : députés en mandat par jour de séance observable ; `nb_deputes` compte
  tout député passé par le groupe (tous passent par « Non inscrits » avant la formation des groupes).

## Volume de présence (jours unitaires)

À côté du taux, chaque vue donne le **volume** : combien de jours le député a été là, toutes sources confondues.

- `jours_presence` : jours avec au moins une trace de présence — vote personnel, prise de parole / interruption /
  présidence, présence en commission —, **attendus ou non** (une parole un jour de questions au Gouvernement
  compte). Un jour est compté une fois, même si le député a voté, parlé et siégé en commission.
- `jours_vote`, `jours_debat`, `jours_commission` : jours avec au moins une trace de chaque source (se recoupent).
- `mois_actifs` (député) / `mois_deputes_actifs` (groupe, Assemblée) : mois avec au moins une séance tenue ou un
  jour attendu pendant le mandat — août et mois hors mandat exclus, un député arrivé en cours de route n'est pas
  pénalisé.
- `jours_presence_par_mois` : moyenne de jours de présence **d'un député** par mois actif (pour un groupe ou
  l'Assemblée : jours de présence ÷ mois-députés actifs) ; `jours_presence_par_depute` dans les vues mensuelles
  des groupes et de l'Assemblée.

Ordre de grandeur (législature 17) : ~6,9 jours de présence par mois et par député (médiane 6,9, de 4,5 à 9,1
entre les 1er et 9e déciles), soit ~83 jours par an.

## Découpages annuels (`agg_*_presence_annuelle`)

Colonne `type_periode`, avec `periode` (libellé), `periode_debut` et `periode_fin` :

| `type_periode` | Bornes | `periode` | Député | Groupe, Assemblée |
|---|---|---|---|---|
| `civile` | 1er janvier → 31 décembre | `2025` | ✅ | ✅ |
| `parlementaire` | 1er octobre → 30 septembre, comme les sessions de l'AN (ordinaire d'octobre à juin + extraordinaires de juillet / septembre) | `2025-2026` | ✅ | ✅ |
| `mandat` | années successives depuis la première prise de fonction du député dans la législature (`debut_mandat`) | `1`, `2`… | ✅ | — (bornes propres à chaque député, non additionnables) |

L'année parlementaire est la plus comparable : chaque année complète contient exactement une session ordinaire et
un budget. Juillet–septembre 2024 (début de la 17ᵉ législature) relève de `2023-2024`, comme les sessions
extraordinaires de l'été à l'AN. Une période incomplète (début ou fin de législature, année en cours) a moins de
mois actifs : comparer `jours_presence_par_mois` plutôt que les totaux.

## Pourquoi ces choix (mesurés sur les législatures 16 et 17)

- **En jours, pas en scrutins** : une journée budgétaire peut compter des centaines de scrutins ; raisonner en
  jours met toutes les sources sur la même échelle.
- **Votes par délégation exclus** : 274 326 votes sur 2,08 millions (13 %) sont émis par un collègue. Les taux les
  plus bas sont ceux de députés qui votent surtout par délégation (ex. 3 568 votes délégués pour 600 personnels).
- **Calendrier des séances = séances tenues, pas l'agenda** : l'agenda marque « Confirmé » des séances qui n'ont
  pas eu lieu (9 jours en législature 17 sans compte rendu ni scrutin, ex. le 18 décembre 2024 après la censure du
  gouvernement) et contient les séances à venir. Un compte rendu publié ou un scrutin prouve que la séance s'est
  tenue.
- **Séances sans vote non attendues** : sur ~290 à 310 jours de séance tenus par législature, 31 (16) et 40 (17)
  n'ont aucun scrutin public — questions au Gouvernement, semaines de contrôle, déclarations du Gouvernement
  suivies d'un débat, installation du bureau (surtout des mardis et mercredis). L'hémicycle y est souvent plein,
  mais seuls les orateurs sont visibles : ~60 en moyenne sur 576 députés. Compter ces jours comme attendus
  imputerait ~90 % d'absences fictives ; ils sont donc hors taux, et une prise de parole ces jours-là reste une
  présence (`jours_presence_non_attendus`).
- **Réunions futures ignorées** : une réunion à venir peut avoir une liste pré-remplie (tous « absents ») ; seules
  les réunions déjà tenues comptent.
- **Dénominateur commission = mandats** : la liste de présence de l'open data compte comme « présents » des
  non-membres venus assister, et « absent » y est déduit (voir `sql/scripts/reunions/README.md`).

## Ordres de grandeur (novembre 2026)

| Législature | Taux de présence | En séance | En commission | Excusés | Participation scrutins |
|---|---|---|---|---|---|
| 16 | 59,1 % | 50,9 % | 47,6 % | 11,1 % | 23,1 % |
| 17 | 56,4 % | 50,3 % | 36,9 % | 9,9 % | 21,3 % |

Par député (législature 17, ≥ 50 jours attendus) : de ~12 % à ~82 %, médiane ~53 %.

## Limites

- **Borne basse** : un député présent en séance qui ne vote pas et ne parle pas n'est pas vu. Les séances sans
  vote sont écartées pour cette raison, mais un jour de séance avec scrutins où il est présent sans voter reste
  compté absent.
- **Séances sans vote** (questions au Gouvernement…) : la présence y est réelle mais non mesurable par l'open
  data ; elle n'entre pas dans le taux.
- **Commissions sans liste** : les missions d'information et les séances publiques n'ont pas de liste de
  présence ; seules les réunions qui en ont une comptent.
- **Mois sans séance observable** (vacances, juillet de début de législature…) : le taux mensuel n'y reflète que
  les commissions, et `effectif_moyen` est null.

## Exploitation

- Jobs : `workflow/aggregat/job/{reunions,debats,scrutins,presence}/aggregation(-oneshot).ts`. **Ordre requis** :
  les briques (`reunions`, `debats`, `scrutins`) avant `presence`, qui les lit — c'est l'ordre des orchestrateurs
  `trtAggregatCollecte*.ts` et de `menu.sh` (*Aggregation Jobs* → 12 / 13).
- `recreateView.ts` sur une brique fait un `DROP … CASCADE` qui emporte les vues `presence` qui en dépendent :
  relancer ensuite le one-shot du domaine `presence` (idempotent) pour les recréer.
- Test d'intégration de la chaîne complète : `workflow/aggregat/job/presence/presence.it.spec.ts` (un scénario
  par règle).

## Jour par jour et rythme de la semaine

- `agg_assemblee_presence_jour` : une ligne par jour (députés attendus / présents, présence en séance, scrutins,
  `jour_semaine` ISO) — courbe journalière de l'Assemblée.
- `agg_assemblee_presence_jour_semaine` : présence par jour de la semaine sur la législature (taux pondérés).
  Législature 17 : ~68 % le mardi et ~74 % le mercredi (votes solennels, questions au Gouvernement), ~41 % le
  lundi et ~35 % le vendredi (circonscription).
