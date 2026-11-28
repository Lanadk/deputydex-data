import { runAsCli, runDomainAggregation } from "../domainAggregation";
import { VIEWS } from "./aggregation-oneshot";

// ==============================================================================
// PRESENCE AGGREGATION - REFRESH JOB
// Rafraîchit les vues du domaine presence, dans l'ordre de VIEWS (aggregation-oneshot.ts).
// ==============================================================================

export const main = (): Promise<void> => runDomainAggregation("refresh", "presence", VIEWS);

if (require.main === module) runAsCli(main);