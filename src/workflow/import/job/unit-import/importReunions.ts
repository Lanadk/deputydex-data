import * as fs from "fs";
import * as path from "path";
import { Logger, LogLevel } from "../../../../utils/logger";
import { confirm } from "../../../../utils/confirm";
import { writerPool } from "../../../_common/infrastructure/db/pool";
import { PipelineJob, Step } from "../../../_common/job/PipelineJob";

// ==============================================================================
// REUNIONS IMPORT JOB
// Import des JSON réunions (agenda : commissions, séances, groupes d'études)
// Raw → Snapshot → Final avec cleanup optionnel
// ==============================================================================

const repoRoot = path.resolve(__dirname, "../../../../..");
const srcDir = path.join(repoRoot, "src");
const rootDataDir = path.resolve(repoRoot, "..");

const SCHEMA_DIR = path.join(srcDir, "sql", "schema");
const SCRIPTS_DIR = path.join(srcDir, "sql", "scripts", "reunions");
const TABLES_DIR = path.join(rootDataDir, "data", "parser", "tables");

/** Fichier parsé → table raw → projection snapshot. */
const TABLES: Array<{ label: string; file: string; rawTable: string; projection: string }> = [
    { label: "réunions", file: "reunions.json", rawTable: "reunions_raw", projection: "project_reunions.sql" },
    {
        label: "réunions participants",
        file: "reunionsParticipants.json",
        rawTable: "reunions_participants_raw",
        projection: "project_reunions_participants.sql",
    },
    {
        label: "réunions points ODJ",
        file: "reunionsPointsOdj.json",
        rawTable: "reunions_points_odj_raw",
        projection: "project_reunions_points_odj.sql",
    },
    {
        label: "réunions points ODJ dossiers",
        file: "reunionsPointsOdjDossiers.json",
        rawTable: "reunions_points_odj_dossiers_raw",
        projection: "project_reunions_points_odj_dossiers.sql",
    },
];

async function main(): Promise<void> {
    const logger = new Logger(LogLevel.INFO);
    const job = new PipelineJob(writerPool, logger);
    const autoCleanup = process.argv.includes("--auto-cleanup");

    if (!fs.existsSync(SCHEMA_DIR) || !fs.existsSync(TABLES_DIR)) {
        logger.error(`Missing directory: ${!fs.existsSync(SCHEMA_DIR) ? SCHEMA_DIR : TABLES_DIR}`);
        process.exit(1);
    }

    logger.info("==============================================");
    logger.info("  REUNIONS IMPORT JOB");
    logger.info("==============================================");

    const steps: Step[] = [
        { kind: "sqlFile", label: "[SCHEMA] Import schema", path: path.join(SCHEMA_DIR, "reunions.schema.sql") },
    ];

    const legislatures = fs
        .readdirSync(TABLES_DIR)
        .filter(name => /^\d+$/.test(name))
        .sort();

    for (const legislature of legislatures) {
        const dir = path.join(TABLES_DIR, legislature);

        for (const table of TABLES) {
            steps.push({
                kind: "importRaw",
                label: `[RAW ${legislature}] ${table.label}`,
                jsonFile: path.join(dir, table.file),
                rawTable: table.rawTable,
                projectionSqlFile: path.join(SCRIPTS_DIR, "projections", table.projection),
            });
        }
    }

    steps.push({
        kind: "sqlFile",
        label: "[SYNC] Snapshot → Final",
        path: path.join(SCRIPTS_DIR, "sync/sync_snapshot_to_final.sql"),
    });

    await job.run(steps);

    await job.run([
        {
            kind: "sqlFile",
            label: "[CLEANUP] Drop snapshots",
            path: path.join(SCRIPTS_DIR, "cleanup/drop_snapshots_tables.sql"),
        },
    ]);

    const dropRaw = autoCleanup || (await confirm("Drop raw tables? (y/n) "));
    if (dropRaw) {
        await job.run([
            {
                kind: "sqlFile",
                label: "[CLEANUP] Drop raw tables",
                path: path.join(SCRIPTS_DIR, "cleanup/drop_raw_tables.sql"),
            },
        ]);
    } else {
        logger.info("⏭️  [CLEANUP] Raw tables kept");
    }

    await job.run([
        { kind: "sqlFile", label: "[VERIFY] Final row counts", path: path.join(SCRIPTS_DIR, "verify/final_counts.sql") },
    ]);

    logger.success("✅ IMPORT COMPLETED");
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
