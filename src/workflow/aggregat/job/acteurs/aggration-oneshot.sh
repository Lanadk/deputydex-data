#!/usr/bin/env bash

# ==============================================================================
# ACTEURS AGGREGATION - CREATE SCRIPT (ONE SHOT)
# Création initiale des materialized views d'agrégation des acteurs
# A lancer une seule fois lors du premier déploiement
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../paths.sh"
source "$SCRIPT_DIR/../json-import-utils.sh"

SQL_SCRIPTS_DIR="//sql/scripts/acteurs/aggregations"

# ==============================================================================
# SQL EXECUTION
# ==============================================================================
run_sql_file() {
    local file=$1
    docker exec -i "$DB_CONTAINER" \
        psql -U "$DB_USER_WRITER" -d "$DB_NAME" \
        -f "$file"
}

# ==============================================================================
# WRAPPERS
# ==============================================================================

create_view() {
    local view_name=$1
    local sql_file=$2
    echo "📊 [CREATE] Creating $view_name..."
    run_sql_file "$sql_file"
    echo "✓ [CREATE] $view_name done"
    echo " ------------- "
}

# ==============================================================================
# MAIN
# ==============================================================================
echo "=============================================="
echo "  ACTEURS AGGREGATION - CREATE (ONE SHOT)"
echo "=============================================="
echo ""

create_view "agg_acteurs_stats_professions"      "$SQL_SCRIPTS_DIR/agg_acteurs_stats_professions.sql"
create_view "agg_acteurs_stats_genre"            "$SQL_SCRIPTS_DIR/agg_acteurs_stats_genre.sql"
create_view "agg_acteurs_stats_age"              "$SQL_SCRIPTS_DIR/agg_acteurs_stats_age.sql"
create_view "agg_acteurs_stats_geographie_election"  "$SQL_SCRIPTS_DIR/agg_acteurs_stats_geographie_election.sql"
create_view "agg_acteurs_stats_geographie_naissance" "$SQL_SCRIPTS_DIR/agg_acteurs_stats_geographie_naissance.sql"

echo ""
echo "=============================================="
echo "  ✅ ACTEURS AGGREGATION CREATED"
echo "  ⚠️  NE PAS RELANCER CE SCRIPT"
echo "  👉 Pour mettre à jour : acteurs-aggregation.sh"
echo "=============================================="