#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../utils/sql-utils.sh"

echo "=============================================="
echo "  GROUPES AGGREGATION REFRESH SCRIPT"
echo "=============================================="
echo ""

refresh_view "agg_groupes_current_effectifs"
refresh_view "agg_groupes_legislature_effectifs"
refresh_view "agg_groupes_stats_cohesion"
refresh_view "agg_groupes_stats_couverture_scrutins"
refresh_view "agg_groupes_stats_participation_legislature"
refresh_view "agg_groupes_stats_participation_mensuelle"
refresh_view "agg_groupes_stats_votes_participation"
refresh_view "agg_groupes_stats_votes_positions"

echo ""
echo "=============================================="
echo "  ✅ GROUPES AGGREGATION REFRESHED"
echo "=============================================="