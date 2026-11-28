import { runAsCli, runDomainAggregation } from "../domainAggregation";
import { VIEWS } from "./aggregation-oneshot";

// ==============================================================================
// DEBATS AGGREGATION - REFRESH JOB
// Rafraîchit les vues du domaine debats, dans l'ordre de VIEWS (aggregation-oneshot.ts).
// ==============================================================================

export const main = (): Promise<void> => runDomainAggregation("refresh", "debats", VIEWS);

if (require.main === module) runAsCli(main);