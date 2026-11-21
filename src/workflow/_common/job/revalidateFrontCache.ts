import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import { Logger, LogLevel } from "../../../utils/logger";

// ==============================================================================
// REVALIDATE FRONT CACHE — dernière étape d'`updateAll`
// ==============================================================================
// Le front (deputydex) garde les réponses de ses routes API en cache serveur
// (1 jour). Une fois l'import terminé, on lui demande de vider ce cache pour
// que les nouvelles données apparaissent tout de suite, sans redéploiement.
// Configuration : `.env` déployé par deputydex-cd.
//
// Sans configuration (poste local), l'étape est ignorée avec un avertissement.
// Si le front refuse ou ne répond pas : code de sortie non nul (visible dans le
// log du cron) ; les données importées restent valables et le front les
// affichera au plus tard à l'expiration de son cache (1 jour).
//
// Usage : npx ts-node src/workflow/_common/job/revalidateFrontCache.ts
// ==============================================================================

export type RevalidateOutcome =
    | { status: "skipped"; reason: string }
    | { status: "done"; httpStatus: number }
    | { status: "failed"; reason: string };

export interface RevalidateOptions {
    url: string | undefined;
    secret: string | undefined;
    fetchFn?: typeof fetch;
    timeoutMs?: number;
}

export async function revalidateFrontCache({ url, secret, fetchFn = fetch, timeoutMs = 10_000 }: RevalidateOptions): Promise<RevalidateOutcome> {
    if (!url || !secret) {
        return { status: "skipped", reason: "non configuré" };
    }

    try {
        const response = await fetchFn(url, {
            method: "POST",
            headers: { Authorization: `Bearer ${secret}` },
            signal: AbortSignal.timeout(timeoutMs),
        });
        if (!response.ok) {
            return { status: "failed", reason: `le front a répondu ${response.status}` };
        }
        return { status: "done", httpStatus: response.status };
    } catch (error) {
        return { status: "failed", reason: error instanceof Error ? error.message : String(error) };
    }
}

function loadEnv(): void {
    const rootDir = resolve(__dirname, "../../../..");
    const envPath = resolve(rootDir, ".env.local");
    const fallbackEnvPath = resolve(rootDir, ".env");
    if (existsSync(envPath)) config({ path: envPath });
    else if (existsSync(fallbackEnvPath)) config({ path: fallbackEnvPath });
}

async function main(): Promise<void> {
    loadEnv();
    const logger = new Logger(LogLevel.INFO);
    const outcome = await revalidateFrontCache({
        url: process.env.FRONT_REVALIDATE_URL,
        secret: process.env.REVALIDATE_SECRET,
    });

    switch (outcome.status) {
        case "skipped":
            logger.warn(`Cache du front non vidé : ${outcome.reason} (il expirera de lui-même sous 1 jour)`);
            return;
        case "done":
            logger.success("🧹 Cache du front vidé : les nouvelles données sont en ligne");
            return;
        case "failed":
            logger.error(`✗ Cache du front non vidé : ${outcome.reason} (il expirera de lui-même sous 1 jour)`);
            process.exitCode = 1;
    }
}

if (require.main === module) {
    void main();
}
