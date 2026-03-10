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
echo "🚀 Starting ALL REFERENTIALS creation"
echo "=============================================="
echo ""

echo " Creating organe type referentials table"
run_sql_file "//sql/scripts/mandats/referentials/ref_organe_type.sql"
echo " Creating scrutin type referentials table"
run_sql_file "//sql/scripts/scrutins/referentials/ref_scrutin_type.sql"


# -- Verification --------------------------------------------------------------
echo "=============================================="
echo "  📊 [VERIFY] Final row counts"
echo "=============================================="
run_sql_file "//sql/scripts/_shared/verify_final_count_ref_tables.sql"
echo ""

echo ""
echo "=============================================="
echo "  ✅ REFERENTIALS DATA TABLES CREATED"
echo "=============================================="