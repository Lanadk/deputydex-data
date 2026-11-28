import * as path from "path";
import { VIEWS as ACTEURS_VIEWS } from "./job/acteurs/aggregation-oneshot";
import { VIEWS as GROUPES_VIEWS } from "./job/groups/aggregation-oneshot";
import { VIEWS as CALENDAR_VIEWS } from "./job/calendar/aggregation-oneshot";
import { VIEWS as DEPUTES_VIEWS } from "./job/deputes/aggregation-oneshot";
import { VIEWS as REUNIONS_VIEWS } from "./job/reunions/aggregation-oneshot";
import { VIEWS as DEBATS_VIEWS } from "./job/debats/aggregation-oneshot";
import { VIEWS as SCRUTINS_VIEWS } from "./job/scrutins/aggregation-oneshot";
import { VIEWS as PRESENCE_VIEWS } from "./job/presence/aggregation-oneshot";

// ==============================================================================
// REGISTRE DES VUES D'AGREGATION
// Construit à partir des listes VIEWS déjà déclarées (et exportées) dans chaque
// aggregation-oneshot.ts, pour éviter toute troisième copie de la liste des
// vues à maintenir en plus des deux jobs par domaine (create/refresh) — voir
// aggregat/repo.md > "⚠️ Attention".
// Consommé par recreateView.ts (DROP + CREATE à la demande).
// ==============================================================================

const repoRoot = path.resolve(__dirname, "../../..");

const DOMAINS: Array<{ label: string; views: readonly string[] }> = [
    { label: "acteurs", views: ACTEURS_VIEWS },
    { label: "groups", views: GROUPES_VIEWS },
    { label: "calendar", views: CALENDAR_VIEWS },
    { label: "deputes", views: DEPUTES_VIEWS },
    { label: "reunions", views: REUNIONS_VIEWS },
    { label: "debats", views: DEBATS_VIEWS },
    { label: "scrutins", views: SCRUTINS_VIEWS },
    { label: "presence", views: PRESENCE_VIEWS },
];

export interface ViewEntry {
    domain: string;
    sqlPath: string;
}

export const VIEW_REGISTRY: Record<string, ViewEntry> = {};

for (const domain of DOMAINS) {
    const scriptsDir = path.join(repoRoot, "src", "sql", "scripts", domain.label, "aggregations");
    for (const viewName of domain.views) {
        VIEW_REGISTRY[viewName] = {
            domain: domain.label,
            sqlPath: path.join(scriptsDir, `${viewName}.sql`),
        };
    }
}
