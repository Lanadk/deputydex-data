#!/usr/bin/env bash

# ==============================================================================
# ACTEURS AGGREGATION - CREATE SCRIPT (ONE SHOT)
# Création initiale des materialized views d'agrégation des acteurs
# A lancer une seule fois lors du premier déploiement
# ==============================================================================

set -e

# Déterminer le répertoire du script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../utils/sql-utils.sh"

SQL_SCRIPTS_DIR="//sql/scripts/acteurs/aggregations"

# ==============================================================================
# MAIN
# ==============================================================================
echo "=============================================="
echo "  ACTEURS AGGREGATION - CREATE (ONE SHOT)"
echo "=============================================="
echo ""

create_view "agg_acteurs_stats_professions"          "$SQL_SCRIPTS_DIR/agg_acteurs_stats_professions.sql"
create_view "agg_acteurs_stats_genre"                "$SQL_SCRIPTS_DIR/agg_acteurs_stats_genre.sql"
create_view "agg_acteurs_stats_age"                  "$SQL_SCRIPTS_DIR/agg_acteurs_stats_age.sql"
create_view "agg_acteurs_stats_geographie_election"  "$SQL_SCRIPTS_DIR/agg_acteurs_stats_geographie_election.sql"
create_view "agg_acteurs_stats_geographie_naissance" "$SQL_SCRIPTS_DIR/agg_acteurs_stats_geographie_naissance.sql"

echo ""
echo "=============================================="
echo "  ✅ ACTEURS AGGREGATION CREATED"
echo "  ⚠️  NE PAS RELANCER CE SCRIPT"
echo "  👉 Pour mettre à jour : acteurs-aggregation.sh"
echo "=============================================="