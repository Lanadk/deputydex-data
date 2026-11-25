import { spawnSync } from "child_process";
import path from "path";
import { Logger, LogLevel } from "../../utils/logger";

// ==============================================================================
// UPDATE ALL — équivalent non interactif de `workflow_update` (menu.sh)
// ==============================================================================
// Point d'entrée du cron quotidien en prod (deputydex-cd > deploy-cron-jobs).
// Enchaîne download → parse → import (--auto-cleanup) → purge des anciens
// téléchargements (7 derniers gardés) → referentials →
// enrichment → refresh des vues matérialisées → log de monitoring → vidage du
// cache du front (revalidateFrontCache.ts), et s'arrête
// à la première étape en échec (code de sortie non nul -> visible dans le log
// du cron).
//
// Chaque étape tourne dans son propre process ts-node, comme dans menu.sh :
// chaque job garde son cycle de vie habituel (pool ouvert/fermé par son entrée
// CLI) et la mémoire du parser est rendue à la fin de son étape.
//
// Usage : npx ts-node src/workflow/update/updateAll.ts
// ==============================================================================

export interface UpdateStep {
    label: string;
    script: string; // relatif à src/
    args?: string[];
}

export const UPDATE_STEPS: UpdateStep[] = [
    { label: "Download", script: "workflow/download/job/trtCollecteData.ts" },
    { label: "Parser", script: "workflow/parser/job/trtCheckCollecte.ts" },
    { label: "Import", script: "workflow/import/job/trtImportCollecte.ts", args: ["--auto-cleanup"] },
    // Après l'import : les zips de la collecte du jour ne servent plus. Non bloquant.
    { label: "Purge old downloads", script: "workflow/download/job/purgeOldDownloads.ts" },
    { label: "Referentials", script: "workflow/referentials/job/trtUpdateReferentials.ts" },
    { label: "Enrichment", script: "workflow/enrichment/job/trtEnrichmentCollecte.ts" },
    { label: "Aggregat (refresh)", script: "workflow/aggregat/job/trtAggregatCollecte.ts" },
    { label: "Dataset update monitoring", script: "workflow/_common/job/logDatasetUpdate.ts" },
    // En dernier : le front relit la base (données ET date de mise à jour ci-dessus).
    { label: "Front cache revalidation", script: "workflow/_common/job/revalidateFrontCache.ts" },
];

const srcDir = path.resolve(__dirname, "../..");
const repoRoot = path.resolve(srcDir, "..");
const tsNodeBin = path.join(repoRoot, "node_modules", ".bin", process.platform === "win32" ? "ts-node.cmd" : "ts-node");

function main(): void {
    const logger = new Logger(LogLevel.INFO);
    const startedAt = Date.now();
    logger.info(`======== UPDATE ALL — ${new Date().toISOString()} ========`);

    for (const step of UPDATE_STEPS) {
        const stepStartedAt = Date.now();
        logger.info(`▶ ${step.label} (${step.script})...`);

        const result = spawnSync(tsNodeBin, [step.script, ...(step.args ?? [])], {
            cwd: srcDir,
            stdio: "inherit",
            env: process.env,
            shell: process.platform === "win32",
        });

        const duration = Math.round((Date.now() - stepStartedAt) / 1000);
        if (result.error || result.status !== 0) {
            const reason = result.error ? result.error.message : `exit code ${result.status ?? result.signal}`;
            logger.error(`✗ ${step.label} failed after ${duration}s (${reason}) — update interrompu`);
            process.exitCode = 1;
            return;
        }
        logger.success(`✓ ${step.label} done (${duration}s)`);
    }

    const total = Math.round((Date.now() - startedAt) / 1000);
    logger.success(`🎉 Update completed in ${total}s`);
}

if (require.main === module) {
    main();
}

export { main };
