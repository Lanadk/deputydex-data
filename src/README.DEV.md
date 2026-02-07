# README.dev.md - Guide de Développement ETL

## 📋 Vue d'ensemble

Ce document explique comment implémenter les scripts ETL pour de nouveaux domaines dans le projet. Chaque ticket ETL nécessite l'implémentation de plusieurs composants dans différents dossiers du projet.

---

## 🎯 Tickets Script ETL - Domaines

Lorsque vous travaillez sur un ticket demandant l'implémentation d'un script ETL pour un domaine spécifique (ex: "Ticket script ETL - users", "Ticket script ETL - products"), vous devez suivre le processus en 3 étapes décrit ci-dessous.

---

## 🔧 Implémentation en 3 Étapes

### Étape 1 : Données de Seed (Sources de Données)

**📍 Emplacement :** `src/sql/data/seed.sql`

**Action :** Ajouter les items à télécharger dans la base de données (table `param_data_sources`)

**Exemple de contenu :**
```sql
-- Insertion des paramètres de sources de données pour le domaine
INSERT INTO param_data_sources (domain_id, legislature_id, download_url, file_name)
VALUES
    (
            (SELECT id FROM ref_data_domains WHERE code = 'acteurs'),
            (SELECT id FROM param_legislatures WHERE number = 16),
            'https://data.assemblee-nationale.fr/static/openData/repository/16/amo/acteurs_mandats_organes_divises/AMO50_acteurs_mandats_organes_divises.json.zip',
            'AMO50_acteurs_mandats_organes_divises.json.zip'
    ),
    (
            (SELECT id FROM ref_data_domains WHERE code = 'votes'),
            (SELECT id FROM param_legislatures WHERE number = 16),
            'https://data.assemblee-nationale.fr/static/openData/repository/16/loi/scrutins/Scrutins.json.zip',
            'Scrutins.json.zip'
    )
ON CONFLICT DO NOTHING;
```

**Notes :**
- Ces données seront chargées lors de l'initialisation de la base
- Utilisez les `SELECT` pour référencer les IDs des domaines et législatures existants
- Le `ON CONFLICT DO NOTHING` évite les doublons lors de réexécutions
- Assurez-vous que les URLs de téléchargement sont valides et accessibles

---

### Étape 2 : Domain Extractor + Types TypeScript

**Action :** Définir l'extracteur de domaine et les types associés

#### 2.1 - Domain Extractor

**📍 Emplacement :** `src/workflow/parser/batch/JsonParser/domains/`

**Fichier à créer :** `DomainExtractor.ts` (où "Domain" est le nom de votre domaine)


#### 2.2 - Définition des Types

**📍 Emplacement :** `src/workflow/parser/batch/types/`

**Fichier à créer :** `IDomain.ts` (où "Domain" est le nom de votre domaine)


#### 2.3 - Ajout du Job dans la Factory

**📍 Emplacement :** `src/workflow/parser/job/const.ts`

**Action :** Ajouter les constantes du nouveau domaine

**Exemple :**
```typescript
export const domainSourceDirectoryName = 'domain';
export const completeJsonDomainFileName = 'domain-complete.json';
```

**📍 Emplacement :** `src/workflow/parser/job/JobFactory.ts`

**Action :** Ajouter la méthode du nouveau domaine dans la factory

**Exemple :**
```typescript
async runDomainParser(): Promise<void> {
    return runBatch(this.baseDataDir, this.baseExportDir, {
        sourceDir: domainSourceDirectoryName,
        extractor: new DomainExtractor(),
        completeFileName: completeJsonDomainFileName,
        exportTableDir: outTableDirectoryName
    });
}
```

**📍 Emplacement :** `src/workflow/parser/job/parseDomain.ts`

**Fichier à créer :** Script de parsing individuel pour le domaine

**Exemple :**
```typescript
#!/usr/bin/env ts-node

import * as path from 'path';
import {
    domainSourceDirectoryName, baseInData, baseOutData,
    completeJsonDomainFileName,
    outTableDirectoryName
} from "./const";
import {DomainExtractor} from "../batch/JsonParser/domains/DomainExtractor";
import {runBatch} from "../batch/runBatch";

async function main() {
    await runBatch(
        path.resolve(__dirname, baseInData),
        path.resolve(__dirname, baseOutData),
        {
            sourceDir: domainSourceDirectoryName,
            extractor: new DomainExtractor(),
            completeFileName: completeJsonDomainFileName,
            exportTableDir: outTableDirectoryName
        }
    );

    console.log('✓ Domain exportés');
}

main().catch(console.error);
```

**📍 Emplacement :** `src/workflow/parser/job/trtCheckCollecte.ts`

**Action :** Ajouter l'appel du parser dans la fonction main

**Exemple :**
```typescript
async function main() {
    const jobFactory = new JobFactory();

    await jobFactory.runActeursParser();
    await jobFactory.runScrutinsParser();
    await jobFactory.runDomainParser(); // <- Ajouter cette ligne

    console.log('🎉 Tous les extractors ont terminé !');
}
```

**Bonnes pratiques :**
- Utilisez des interfaces claires et descriptives
- Ajoutez des commentaires pour les champs complexes
- Utilisez des types stricts (évitez `any`)

---

### Étape 3 : Script Bash d'Import

**📍 Emplacement :** `src/workflow/import/scripts/`

**Fichier à créer :** `domain-import.sh` (où "domain" est le nom de votre domaine)

**Action :** Créer le script bash qui orchestre l'import des données

---
## 🏗️ Structure du Projet (Référence)

```
src/
├── workflow/
│   ├── download/          # Scripts de téléchargement
│   ├── import/
│   │   └── scripts/       # ⭐ Étape 3: Scripts bash d'import
│   │       └── domain-import.sh
│   ├── parser/
│   │   └── batch/
│   │       ├── JsonParser/
│   │       │   └── domains/    # ⭐ Étape 2: Définition de l'extracteur
│   │       └── types/          # ⭐ Étape 2: Définitions des types
│   │           └── IDomain.ts
│   └── update/
└── sql/
    └── data/
        └── seed.sql        # 📊 Étape 1: Données d'initialisation
```

---

**Bon développement ! 🚀**d