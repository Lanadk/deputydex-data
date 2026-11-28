import { runAsCli, runDomainAggregation } from "../domainAggregation";

// ==============================================================================
// SCRUTINS AGGREGATION - CREATE JOB (ONE SHOT)
// Scrutins : votes personnels par jour, scrutins par jour.
// CREATE ... IF NOT EXISTS (vues + index) : idempotent, rejouable sans risque. Ne
// modifie PAS une vue déjà créée dont le .sql a changé : voir recreateView.ts.
// ==============================================================================

// Exportée pour aggregation.ts (refresh) et registry.ts (recreateView) : la seule
// liste des vues du domaine. L'ordre compte : une vue après celles qu'elle lit.
export const VIEWS = [
    "mv_scrutins_presence_jour",
    "mv_scrutins_jours",
];

export const main = (): Promise<void> => runDomainAggregation("create", "scrutins", VIEWS);

if (require.main === module) runAsCli(main);