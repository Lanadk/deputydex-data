# Qualité du code : SonarQube Cloud

Le job `sonar` de la CI (`.github/workflows/ci.yml`) analyse l'ETL avec [SonarQube Cloud](https://sonarcloud.io) : bugs, code dupliqué, code fragile, points sensibles de sécurité, couverture des tests. Gratuit et sans limite pour un dépôt public ; le tableau de bord d'un projet public est **public**.

## Comment c'est branché

- `npm run test:coverage` (job `test`) : tests **unitaires** avec couverture de tout `src/` (`collectCoverageFrom` de `jest.config.js`) → `coverage/lcov.info`, transmis au job `sonar`. Les tests d'intégration (base Postgres) ne comptent pas dans la couverture : les repositories qu'ils couvrent apparaissent non couverts.
- Le job `sonar` lance l'action officielle `SonarSource/sonarqube-scan-action` (épinglée sur un commit), qui lit `sonar-project.properties` : organisation, clé du projet, dossiers analysés (`src`, `prisma`, `local` ; sans le client généré ni les migrations), tests (`*.spec.ts`), rapport de couverture.
- Informatif : un échec ne bloque ni la CI ni le déploiement (`trigger-deploy` ne dépend pas de `sonar`). Sans le secret `SONAR_TOKEN`, le job ne fait rien.

Les badges en tête de `README.md` viennent de SonarQube Cloud et renvoient vers le tableau de bord ; vides tant que la première analyse n'a pas tourné (clé `Lanadk_deputydex-data`, à changer avec `sonar.projectKey`).

## Mise en place (une fois)

1. [sonarcloud.io](https://sonarcloud.io) : organisation `lanadk` (déjà importée pour le front), **Analyze new project** > `deputydex-data`.
2. Vérifier les clés (projet > **Information**) : `sonar.organization` / `sonar.projectKey` de `sonar-project.properties`.
3. **Désactiver l'analyse automatique** : projet > **Administration > Analysis Method** > décocher « Automatic Analysis ».
4. Ajouter le secret `SONAR_TOKEN` au dépôt GitHub (Settings > Secrets and variables > Actions) — le même jeton que le front convient, ou un jeton dédié.
5. Relancer la CI : le projet se remplit dans SonarQube Cloud.
