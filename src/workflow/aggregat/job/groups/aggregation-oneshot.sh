#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../utils/sql-utils.sh"

SQL_SCRIPTS_DIR="//sql/scripts/groups/aggregations"

echo "=============================================="
echo "  GROUPES AGGREGATION - CREATE (ONE SHOT)"
echo "=============================================="
echo ""

### Groupes
create_view "agg_groupes_current_effectifs"               "$SQL_SCRIPTS_DIR/agg_groupes_effectifs_current.sql"
create_view "agg_groupes_legislature_effectifs"           "$SQL_SCRIPTS_DIR/agg_groupes_effectifs_legislature.sql"

create_view "agg_groupes_stats_cohesion_mensuelle"        "$SQL_SCRIPTS_DIR/agg_groupes_stats_cohesion_mensuelle.sql"
create_view "agg_groupes_stats_cohesion_legislature"      "$SQL_SCRIPTS_DIR/agg_groupes_stats_cohesion_legislature.sql"

create_view "agg_groupes_stats_couverture_scrutins"       "$SQL_SCRIPTS_DIR/agg_groupes_stats_couverture_scrutins.sql"

create_view "agg_groupes_stats_participation_legislature" "$SQL_SCRIPTS_DIR/agg_groupes_stats_participation_legislature.sql"
create_view "agg_groupes_stats_participation_mensuelle"   "$SQL_SCRIPTS_DIR/agg_groupes_stats_participation_mensuelle.sql"

create_view "agg_groupes_stats_expression_votes"           "$SQL_SCRIPTS_DIR/agg_groupes_stats_expression_votes.sql"

create_view "agg_groupes_stats_votes_positions_politiques" "$SQL_SCRIPTS_DIR/agg_groupes_stats_votes_positions_politiques.sql"
create_view "agg_groupes_stats_votes_positions_comptables" "$SQL_SCRIPTS_DIR/agg_groupes_stats_votes_positions_comptables.sql"

create_view "agg_groupes_stats_legislature_demographie" "$SQL_SCRIPTS_DIR/agg_groupes_stats_demographie_legislature.sql"

create_view "agg_groupes_stats_stabilite" "$SQL_SCRIPTS_DIR/agg_groupes_stats_stabilite.sql"

create_view "agg_groupes_stats_proximite_votes_legislature" "$SQL_SCRIPTS_DIR/agg_groupes_stats_proximite_votes_legislature.sql"
create_view "agg_groupes_stats_proximite_votes_mensuelle" "$SQL_SCRIPTS_DIR/agg_groupes_stats_proximite_votes_mensuelle.sql"

#### Assemblée nationale
create_view "agg_assemblee_stats_participation_legislature" "$SQL_SCRIPTS_DIR/agg_assemblee_stats_participation_legislature.sql"

echo ""
echo "=============================================="
echo "  ✅ GROUPES AGGREGATION CREATED"
echo "=============================================="