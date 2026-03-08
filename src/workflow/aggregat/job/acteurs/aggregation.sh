#!/usr/bin/env bash

# ==============================================================================
# ACTEURS AGGREGATION SCRIPT
# Rafraîchit les materialized views d'agrégation des acteurs
# ==============================================================================

set -e

# Déterminer le répertoire du script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../utils/sql-utils.sh"

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