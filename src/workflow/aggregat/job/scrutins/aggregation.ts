import { runAsCli, runDomainAggregation } from "../domainAggregation";
import { VIEWS } from "./aggregation-oneshot";

// ==============================================================================
// SCRUTINS AGGREGATION - REFRESH JOB
// Rafraîchit les vues du domaine scrutins, dans l'ordre de VIEWS (aggregation-oneshot.ts).
// ==============================================================================

export const main = (): Promise<void> => runDomainAggregation("refresh", "scrutins", VIEWS);

if (require.main === module) runAsCli(main);