import * as path from "path";
import { Logger, LogLevel } from "../../../utils/logger";
import { writerPool } from "../../_common/infrastructure/db/pool";
import { PipelineJob, Step } from "../../_common/job/PipelineJob";

// ==============================================================================
// JOB D'AGREGATION GENERIQUE D'UN DOMAINE
// Création (one-shot, idempotente) ou rafraîchissement des vues matérialisées
// d'un domaine, à partir de la seule liste de ses vues. Évite de recopier le
// même job dans chaque domaine : un domaine déclare ses VIEWS (exportées pour
// registry.ts) et appelle runDomainAggregation.
// ==============================================================================

export type AggregationMode = "create" | "refresh";

const repoRoot = path.resolve(__dirname, "../../../..");

/** Répertoire des .sql d'agrégation d'un domaine. */
export function aggregationScriptsDir(domain: string): string {
    return path.join(repoRoot, "src", "sql", "scripts", domain, "aggregations");
}

/**
 * Étapes du job, dans l'ordre de `views` : l'ordre compte quand une vue en lit
 * une autre (la source avant la vue qui l'agrège).
 */
export function aggregationSteps(mode: AggregationMode, domain: string, views: readonly string[]): Step[] {
    if (mode === "create") {
        const dir = aggregationScriptsDir(domain);
        return views.map(viewName => ({
            kind: "createView",
            label: `[CREATE] ${viewName}`,
            viewName,
            path: path.join(dir, `${viewName}.sql`),
        }));
    }
    return views.map(viewName => ({ kind: "refreshView", label: `[REFRESH] ${viewName}`, viewName }));
}

export async function runDomainAggregation(mode: AggregationMode, domain: string, views: readonly string[]): Promise<void> {
    const logger = new Logger(LogLevel.INFO);
    const title = `${domain.toUpperCase()} AGGREGATION - ${mode === "create" ? "CREATE (ONE SHOT)" : "REFRESH"}`;

    logger.info("==============================================");
    logger.info(`  ${title}`);
    logger.info("==============================================");

    await new PipelineJob(writerPool, logger).run(aggregationSteps(mode, domain, views));

    logger.success(mode === "create"
        ? `✅ ${domain.toUpperCase()} AGGREGATION CREATED (idempotent, rejouable sans risque)`
        : `✅ ${domain.toUpperCase()} AGGREGATION REFRESHED`);
}

/** Point d'entrée CLI d'un job de domaine : exécute `main` puis ferme le pool. */
export function runAsCli(main: () => Promise<void>): void {
    main()
        .catch(error => {
            console.error("[ERROR  ❌ ]:", error);
            process.exitCode = 1;
        })
        .finally(() => writerPool.end());
}
