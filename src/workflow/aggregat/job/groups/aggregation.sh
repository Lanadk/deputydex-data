#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../utils/sql-utils.sh"

echo "=============================================="
echo "  GROUPES AGGREGATION REFRESH SCRIPT"
echo "=============================================="
echo ""

### Groupes
refresh_view "agg_groupes_effectifs_current"
refresh_view "agg_groupes_effectifs_legislature"

refresh_view "agg_groupes_stats_cohesion_mensuelle"
refresh_view "agg_groupes_stats_cohesion_legislature"

refresh_view "agg_groupes_stats_couverture_scrutins"

refresh_view "agg_groupes_stats_participation_legislature"
refresh_view "agg_groupes_stats_participation_mensuelle"

refresh_view "agg_groupes_stats_expression_votes"

refresh_view "agg_groupes_stats_votes_positions_politiques"
refresh_view "agg_groupes_stats_votes_positions_comptables"

refresh_view "agg_groupes_stats_demographie_legislature"

refresh_view "agg_groupes_stats_stabilite"

refresh_view "agg_groupes_stats_proximite_votes"
refresh_view "agg_groupes_stats_proximite_votes_mensuelle"

### Assemblée nationale
refresh_view "agg_assemblee_stats_participation_legislature"

echo ""
echo "=============================================="
echo "  ✅ GROUPES AGGREGATION REFRESHED"
echo "=============================================="