import { Logger, LogLevel } from "../../../../utils/logger";
import { writerPool } from "../../../_common/infrastructure/db/pool";
import { PipelineJob, Step } from "../../../_common/job/PipelineJob";

// ==============================================================================
// CALENDAR ACTIVITY AGGREGATION - REFRESH JOB
// Rafraîchit les materialized views d'agrégation des calendriers d'activités
// Port TS de calendar/aggregation.sh
// ==============================================================================

// concurrent: false pour la vue détails : une ligne par (député × scrutin) +
// amendements, avec un meta JSONB volumineux. Le REFRESH CONCURRENTLY (copie +
// FULL JOIN de diff + tri) saturait le disque en prod (pgsql_tmp, erreur 53100).
// Contrepartie : la vue est verrouillée en lecture le temps du refresh.
const VIEWS: { viewName: string; concurrent: boolean }[] = [
    { viewName: "agg_activity_calendar_mv", concurrent: true },
    { viewName: "agg_activity_calendar_details_mv", concurrent: false },
];

async function main(): Promise<void> {
    const logger = new Logger(LogLevel.INFO);
    const job = new PipelineJob(writerPool, logger);

    logger.info("==============================================");
    logger.info("  CALENDAR ACTIVITY AGGREGATION REFRESH JOB");
    logger.info("==============================================");

    const steps: Step[] = VIEWS.map(({ viewName, concurrent }) => ({
        kind: "refreshView",
        label: `[REFRESH${concurrent ? "" : " (non concurrent)"}] ${viewName}`,
        viewName,
        concurrent,
    }));

    await job.run(steps);

    logger.success("✅ CALENDAR ACTIVITY AGGREGATION REFRESHED");
}

export { main };

if (require.main === module) {
    main()
        .catch(error => {
            console.error("[ERROR  ❌ ]:", error);
            process.exitCode = 1;
        })
        .finally(() => writerPool.end());
}
