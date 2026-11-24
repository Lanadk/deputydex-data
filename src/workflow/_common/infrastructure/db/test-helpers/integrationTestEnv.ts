/**
 * Base utilisée par les tests d'intégration.
 *
 * Les tests d'intégration exécutent les scripts de synchronisation complets, qui
 * suppriment les lignes de la législature courante absentes du snapshot : lancés
 * sur la base de développement, ils en effacent les vraies données. Ils doivent
 * donc tourner sur une base dédiée :
 *
 * - en local, `DB_NAME_TEST` (dans `.env.local`) désigne cette base ; `DB_NAME` et
 *   `DB_URL` sont redirigés vers elle (le client Prisma comme les Pool `pg`) ;
 * - en CI (`CI=true`), la base du service Postgres est jetable : elle est utilisée
 *   telle quelle ;
 * - sinon, on refuse de lancer les tests.
 */
export function resolveIntegrationDbEnv(env: NodeJS.ProcessEnv): Record<string, string> {
    const testDb = env.DB_NAME_TEST;

    if (!testDb) {
        if (env.CI === 'true') return {};
        throw new Error(
            'Tests d\'intégration : DB_NAME_TEST n\'est pas défini. Ces tests effacent des données de la ' +
            'législature courante : ils ne tournent que sur une base dédiée. Ajouter DB_NAME_TEST=deputydex_it ' +
            'dans .env.local, puis `npm run docker:db` (création) et `npm run prisma:migrate-test` (schéma).'
        );
    }
    if (testDb === env.DB_NAME) {
        throw new Error(`Tests d'intégration : DB_NAME_TEST (${testDb}) doit différer de DB_NAME, la base de développement.`);
    }

    const redirected: Record<string, string> = { DB_NAME: testDb };
    if (env.DB_URL) redirected.DB_URL = withDatabase(env.DB_URL, testDb);
    return redirected;
}

/** Remplace le nom de base d'une URL de connexion Postgres (query string conservée). */
export function withDatabase(connectionUrl: string, database: string): string {
    const url = new URL(connectionUrl);
    url.pathname = `/${database}`;
    return url.toString();
}
