#!/usr/bin/env bash

# ==============================================================================
# SQL UTILS
# Utilitaires SQL réutilisables pour les scripts d'agrégation
# ==============================================================================
# Usage:
#   source sql-sql-utils.sh
# ==============================================================================

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
# VIEW UTILS
# ==============================================================================
create_view() {
    local view_name=$1
    local sql_file=$2
    echo "📊 [CREATE] Creating $view_name..."
    run_sql_file "$sql_file"
    echo "✓ [CREATE] $view_name done"
    echo " ------------- "
}

refresh_view() {
    local view_name=$1
    echo "🔄 [REFRESH] Refreshing $view_name..."
    docker exec "$DB_CONTAINER" psql -U "$DB_USER_WRITER" -d "$DB_NAME" \
        -c "REFRESH MATERIALIZED VIEW CONCURRENTLY $view_name;"
    echo "✓ [REFRESH] $view_name done"
    echo " ------------- "
}

# ==============================================================================
# EXPORT
# ==============================================================================
export -f run_sql_file
export -f create_view
export -f refresh_view