import { readFileSync } from "fs";
import { Pool, PoolClient, QueryResult } from "pg";

export type SqlExecutor = Pool | PoolClient;

export async function runSqlFile(executor: SqlExecutor, filePath: string): Promise<QueryResult> {
    const sql = readFileSync(filePath, "utf-8");
    const result = await executor.query(sql);
    // Un fichier à plusieurs statements résout en tableau de QueryResult (un par
    // statement) plutôt qu'un seul objet : on ne garde que le dernier, celui
    // susceptible de porter les lignes d'un éventuel SELECT final (verify).
    return Array.isArray(result) ? result[result.length - 1] : result;
}

export type RefreshOptions = {
    /**
     * true (défaut) : REFRESH ... CONCURRENTLY — la vue reste lisible pendant le
     * refresh, mais Postgres construit une copie complète puis la diffe contre
     * l'ancienne (FULL JOIN + tri dans pgsql_tmp) : pic disque ≈ 2-3× la taille
     * de la vue.
     * false : REFRESH classique — reconstruit la vue sans diff (bien moins de
     * disque temporaire), mais pose un ACCESS EXCLUSIVE lock qui bloque les
     * lectures pendant toute la durée du refresh. À réserver aux très grosses vues.
     */
    concurrent?: boolean;
};

export async function refreshMaterializedView(
    executor: SqlExecutor,
    viewName: string,
    { concurrent = true }: RefreshOptions = {}
): Promise<void> {
    const mode = concurrent ? "CONCURRENTLY " : "";
    await executor.query(`REFRESH MATERIALIZED VIEW ${mode}${viewName};`);
}
