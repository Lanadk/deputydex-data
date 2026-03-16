#!/usr/bin/env bash

set -e

# TODO Faudra lacher du token ici + un seul fichier d'env
DB_CONTAINER="deputydex-db"
DB_USER_WRITER="user_etl_writer"
DB_NAME="deputydex"


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
# MAIN
# ==============================================================================

echo "=============================================="
echo "🚀 Starting ALL Enrichment process"
echo "=============================================="
echo ""

echo "Enrichment of acteurs_groupes table"
run_sql_file "//sql/scripts/acteurs/enrichment/acteurs_groupes.sql"


# -- Verification --------------------------------------------------------------
echo "=============================================="
echo "  📊 [VERIFY] Final row counts"
echo "=============================================="
run_sql_file "//sql/scripts/_shared/verify_final_count_enrichment_tables.sql"
echo ""

echo ""
echo "=============================================="
echo "  ✅ ENRICHMENT DATA DONE"
echo "=============================================="