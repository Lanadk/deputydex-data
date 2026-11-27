import { runAsCli, runDomainAggregation } from "../domainAggregation";

// ==============================================================================
// REUNIONS AGGREGATION - CREATE JOB (ONE SHOT)
// Réunions : présences en commission par jour.
// CREATE ... IF NOT EXISTS (vues + index) : idempotent, rejouable sans risque. Ne
// modifie PAS une vue déjà créée dont le .sql a changé : voir recreateView.ts.
// ==============================================================================

// Exportée pour aggregation.ts (refresh) et registry.ts (recreateView) : la seule
// liste des vues du domaine. L'ordre compte : une vue après celles qu'elle lit.
export const VIEWS = [
    "mv_reunions_presence_jour",
];

export const main = (): Promise<void> => runDomainAggregation("create", "reunions", VIEWS);

if (require.main === module) runAsCli(main);