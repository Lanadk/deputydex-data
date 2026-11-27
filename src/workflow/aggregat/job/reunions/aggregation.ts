import { runAsCli, runDomainAggregation } from "../domainAggregation";
import { VIEWS } from "./aggregation-oneshot";

// ==============================================================================
// REUNIONS AGGREGATION - REFRESH JOB
// Rafraîchit les vues du domaine reunions, dans l'ordre de VIEWS (aggregation-oneshot.ts).
// ==============================================================================

export const main = (): Promise<void> => runDomainAggregation("refresh", "reunions", VIEWS);

if (require.main === module) runAsCli(main);