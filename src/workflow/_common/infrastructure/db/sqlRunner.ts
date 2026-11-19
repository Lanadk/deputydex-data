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

function quoteIdentifier(name: string): string {
    return `"${name.replace(/"/g, '""')}"`;
}

/**
 * Donne le SELECT sur une vue au rôle lecteur de l'app (`DB_USER_READER`).
 *
 * Filet de sécurité en plus des default privileges de `local-db-init.ts` : une
 * vue recréée (DROP + CREATE) perd ses grants, et une base dont l'init n'a pas
 * été rejoué n'a pas les default privileges `FOR ROLE writer`. Idempotent. Le
 * writer, propriétaire des vues qu'il crée, a le droit de faire ce GRANT.
 *
 * Retourne le rôle à qui le SELECT a été donné, ou null si `DB_USER_READER`
 * n'est pas défini (on ne bloque pas le job pour ça).
 */
export async function grantSelectToReader(
    executor: SqlExecutor,
    objectName: string,
    readerRole: string | undefined = process.env.DB_USER_READER
): Promise<string | null> {
    if (!readerRole) return null;
    await executor.query(`GRANT SELECT ON ${quoteIdentifier(objectName)} TO ${quoteIdentifier(readerRole)};`);
    return readerRole;
}

export async function refreshMaterializedView(executor: SqlExecutor, viewName: string): Promise<void> {
    await executor.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${viewName};`);
}
