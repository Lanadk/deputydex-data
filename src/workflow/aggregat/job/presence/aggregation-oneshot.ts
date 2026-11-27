import { runAsCli, runDomainAggregation } from "../domainAggregation";

// ==============================================================================
// PRESENCE AGGREGATION - CREATE JOB (ONE SHOT)
// Présence : consolidation jour par jour des briques reunions / scrutins / debats, puis taux par député, groupe et Assemblée (législature et mois). Dépend des domaines reunions, scrutins et debats : à exécuter après eux.
// CREATE ... IF NOT EXISTS (vues + index) : idempotent, rejouable sans risque. Ne
// modifie PAS une vue déjà créée dont le .sql a changé : voir recreateView.ts.
// ==============================================================================

// Exportée pour aggregation.ts (refresh) et registry.ts (recreateView) : la seule
// liste des vues du domaine. L'ordre compte : une vue après celles qu'elle lit.
export const VIEWS = [
    "mv_deputes_presence_jour",
    "agg_deputes_presence",
    "agg_deputes_presence_mensuelle",
    "agg_deputes_presence_annuelle",
    "agg_groupes_presence",
    "agg_groupes_presence_mensuelle",
    "agg_groupes_presence_annuelle",
    "agg_assemblee_presence",
    "agg_assemblee_presence_mensuelle",
    "agg_assemblee_presence_annuelle",
];

export const main = (): Promise<void> => runDomainAggregation("create", "presence", VIEWS);

if (require.main === module) runAsCli(main);