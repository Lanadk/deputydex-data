import { runAsCli, runDomainAggregation } from "../domainAggregation";

// ==============================================================================
// DEBATS AGGREGATION - CREATE JOB (ONE SHOT)
// Débats : prises de parole en séance par jour, calendrier des séances réellement tenues.
// CREATE ... IF NOT EXISTS (vues + index) : idempotent, rejouable sans risque. Ne
// modifie PAS une vue déjà créée dont le .sql a changé : voir recreateView.ts.
// ==============================================================================

// Exportée pour aggregation.ts (refresh) et registry.ts (recreateView) : la seule
// liste des vues du domaine. L'ordre compte : une vue après celles qu'elle lit.
export const VIEWS = [
    "mv_debats_presence_jour",
    "mv_debats_seances_jours",
];

export const main = (): Promise<void> => runDomainAggregation("create", "debats", VIEWS);

if (require.main === module) runAsCli(main);