#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../utils/sql-utils.sh"

SQL_SCRIPTS_DIR="//sql/scripts/groups/aggregations"

echo "=============================================="
echo "  GROUPES AGGREGATION - CREATE (ONE SHOT)"
echo "=============================================="
echo ""

create_view "agg_groupes_current_effectifs"            "$SQL_SCRIPTS_DIR/agg_groupes_current_effectifs.sql"
create_view "agg_groupes_legislature_effectifs"        "$SQL_SCRIPTS_DIR/agg_groupes_legislature_effectifs.sql"
create_view "agg_groupes_stats_votes_positions"        "$SQL_SCRIPTS_DIR/agg_groupes_stats_votes_positions.sql"
create_view "agg_groupes_stats_votes_participation"    "$SQL_SCRIPTS_DIR/agg_groupes_stats_votes_participation.sql"
create_view "agg_groupes_stats_cohesion"               "$SQL_SCRIPTS_DIR/agg_groupes_stats_cohesion.sql"

echo ""
echo "=============================================="
echo "  ✅ GROUPES AGGREGATION CREATED"
echo "=============================================="