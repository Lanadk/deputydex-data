#!/usr/bin/env bash

# ==============================================================================
# ACTEURS AGGREGATION SCRIPT
# Rafraîchit les materialized views d'agrégation des acteurs
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../paths.sh"

# ==============================================================================
# WRAPPERS
# ==============================================================================

refresh_view() {
    local view_name=$1
    echo "🔄 Refreshing $view_name..."
    docker exec "$DB_CONTAINER" psql -U "$DB_USER_WRITER" -d "$DB_NAME" \
        -c "REFRESH MATERIALIZED VIEW CONCURRENTLY $view_name;"
    echo "✓ $view_name refreshed"
    echo " ------------- "
}

# ==============================================================================
# MAIN
# ==============================================================================
echo "=============================================="
echo "  ACTEURS AGGREGATION SCRIPT"
echo "=============================================="
echo ""

refresh_view "agg_acteurs_stats_professions"
refresh_view "agg_acteurs_stats_genre"
refresh_view "agg_acteurs_stats_age"
refresh_view "agg_acteurs_stats_geographie_election"
refresh_view "agg_acteurs_stats_geographie_naissance"

echo ""
echo "=============================================="
echo "  ✅ ACTEURS AGGREGATION COMPLETED"
echo "=============================================="