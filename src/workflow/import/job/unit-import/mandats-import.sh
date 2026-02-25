#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/paths.sh"
source "$SCRIPT_DIR/json-import-utils.sh"

AUTO_CLEANUP=false
if [[ "$1" == "--auto-cleanup" ]]; then
    AUTO_CLEANUP=true
    echo "ℹ️  Auto cleanup mode enabled"
fi

SCHEMA_NAME="mandats.schema.sql"
MANDATS_JSON="mandats.json"
MANDATS_SUPPLEANTS_JSON="mandatsSuppleants.json"

project_mandats() {
    local raw_table=$1

    echo "Debug: Checking raw table structure..."
    docker exec "$DB_CONTAINER" psql -U "$DB_USER_WRITER" -d "$DB_NAME" -c \
      "SELECT data->>'uid' as uid, data->>'acteur_uid' as acteur_uid
       FROM mandats_raw
       LIMIT 5;"

    echo "Debug: Checking if acteurs exist..."
    docker exec "$DB_CONTAINER" psql -U "$DB_USER_WRITER" -d "$DB_NAME" -c \
      "SELECT uid FROM acteurs LIMIT 5;"

    echo "Debug: Checking match..."
    docker exec "$DB_CONTAINER" psql -U "$DB_USER_WRITER" -d "$DB_NAME" -c \
      "SELECT
         (SELECT COUNT(*) FROM mandats_raw) as total_mandats,
         (SELECT COUNT(*) FROM acteurs) as total_acteurs,
         (SELECT COUNT(*)
          FROM mandats_raw r
          WHERE EXISTS (SELECT 1 FROM acteurs WHERE uid = r.data->>'acteur_uid')
         ) as matching_mandats;"

    docker exec "$DB_CONTAINER" psql -U "$DB_USER_WRITER" -d "$DB_NAME" -c \
      "INSERT INTO mandats (
           uid, acteur_uid, legislature, type_organe, date_debut, date_fin, date_publication,
           preseance, nomin_principale, code_qualite, lib_qualite, lib_qualite_sex, organe_uid,
           election_region, election_region_type, election_departement, election_num_departement,
           election_num_circo, election_cause_mandat, election_ref_circonscription,
           mandature_date_prise_fonction, mandature_cause_fin, mandature_premiere_election,
           mandature_place_hemicycle, mandature_mandat_remplace_ref
       )
       SELECT
           data->>'uid',
           data->>'acteur_uid',
           (data->>'legislature')::integer,
           data->>'type_organe',
           NULLIF(data->>'date_debut', '')::date,
           NULLIF(data->>'date_fin', '')::date,
           NULLIF(data->>'date_publication', '')::date,
           (data->>'preseance')::integer,
           (data->>'nomin_principale')::integer,
           data->>'code_qualite',
           data->>'lib_qualite',
           data->>'lib_qualite_sex',
           data->>'organe_uid',
           data->>'election_region',
           data->>'election_region_type',
           data->>'election_departement',
           data->>'election_num_departement',
           data->>'election_num_circo',
           data->>'election_cause_mandat',
           data->>'election_ref_circonscription',
           NULLIF(data->>'mandature_date_prise_fonction', '')::date,
           data->>'mandature_cause_fin',
           CASE
               WHEN data->>'mandature_premiere_election' = 'true' THEN true
               WHEN data->>'mandature_premiere_election' = 'false' THEN false
               ELSE NULL
           END,
           data->>'mandature_place_hemicycle',
           data->>'mandature_mandat_remplace_ref'
       FROM $raw_table
       WHERE EXISTS (
           SELECT 1 FROM acteurs WHERE uid = data->>'acteur_uid'
       )
       ON CONFLICT (uid) DO NOTHING;"

    docker exec "$DB_CONTAINER" psql -U "$DB_USER_WRITER" -d "$DB_NAME" -c \
      "SELECT COUNT(*) as orphaned_mandats
       FROM $raw_table
       WHERE NOT EXISTS (
           SELECT 1 FROM acteurs WHERE uid = data->>'acteur_uid'
       );" | tail -n 3 | head -n 1 | xargs echo "⚠️  Skipped orphaned mandats:"
}

project_mandats_suppleants() {
    local raw_table=$1
    docker exec "$DB_CONTAINER" psql -U "$DB_USER_WRITER" -d "$DB_NAME" -c \
      "INSERT INTO mandats_suppleants (
           mandat_uid, suppleant_uid, date_debut, date_fin
       )
       SELECT
           data->>'mandat_uid',
           data->>'suppleant_uid',
           NULLIF(data->>'date_debut', '')::date,
           NULLIF(data->>'date_fin', '')::date
       FROM $raw_table
       ON CONFLICT (mandat_uid, suppleant_uid) DO NOTHING;"
}

for dir in "$SCHEMA_DIR" "$TABLES_DIR"; do
  if [ ! -d "$dir" ]; then
    echo "❌ Missing directory: $dir"
    exit 1
  fi
done

echo "=============================================="
echo "MANDATS IMPORT SCRIPT"
echo "=============================================="
echo ""

echo "Importing schema..."
cat "$SCHEMA_DIR/$SCHEMA_NAME" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER_WRITER" -d "$DB_NAME"
echo "✓ Schema imported"
echo ""

# ==============================================================================
# BOUCLE SUR LES LÉGISLATURES
# ==============================================================================
for LEGISLATURE_DIR in "$TABLES_DIR"/*/; do
    LEGISLATURE=$(basename "$LEGISLATURE_DIR")
    if ! [[ "$LEGISLATURE" =~ ^[0-9]+$ ]]; then continue; fi

    echo "=============================================="
    echo "🏛️  Legislature $LEGISLATURE"
    echo "=============================================="
    echo ""

    echo "=============================================="
    echo "MANDATS"
    echo "=============================================="
    import_json_to_raw_table "$LEGISLATURE_DIR/$MANDATS_JSON" "mandats_raw" "project_mandats"
    echo "✓ Mandats imported"
    echo ""

    echo "=============================================="
    echo "MANDATS_SUPPLEANTS"
    echo "=============================================="
    import_json_to_raw_table "$LEGISLATURE_DIR/$MANDATS_SUPPLEANTS_JSON" "mandats_suppleants_raw" "project_mandats_suppleants"
    echo "✓ Suppléants imported"
    echo ""

done

# ==============================================================================
# CLEANUP
# ==============================================================================
echo "=============================================="
echo "CLEANUP"
echo "=============================================="

if [[ "$AUTO_CLEANUP" == true ]]; then
    echo "🤖 Auto cleanup enabled - dropping raw tables..."
    docker exec "$DB_CONTAINER" psql -U "$DB_USER_WRITER" -d "$DB_NAME" -c \
      "DROP TABLE IF EXISTS mandats_raw, mandats_suppleants_raw CASCADE;"
    echo "✓ Raw tables dropped"
else
    read -p "Do you want to drop raw tables? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker exec "$DB_CONTAINER" psql -U "$DB_USER_WRITER" -d "$DB_NAME" -c \
          "DROP TABLE IF EXISTS mandats_raw, mandats_suppleants_raw CASCADE;"
        echo "✓ Raw tables dropped"
    fi
fi
echo ""

# ==============================================================================
# FINAL VERIFICATION
# ==============================================================================
echo "=============================================="
echo "FINAL VERIFICATION"
echo "=============================================="

docker exec "$DB_CONTAINER" psql -U "$DB_USER_WRITER" -d "$DB_NAME" -c "
SELECT
  'mandats' as table_name, COUNT(*) as count FROM mandats
UNION ALL
SELECT 'mandats_suppleants', COUNT(*) FROM mandats_suppleants;
"

echo ""
echo "=============================================="
echo "RELATIONSHIPS VERIFICATION"
echo "=============================================="

docker exec "$DB_CONTAINER" psql -U "$DB_USER_WRITER" -d "$DB_NAME" -c "
SELECT
    'Mandats with acteurs' as check_name,
    COUNT(*) as count
FROM mandats m
INNER JOIN acteurs a ON m.acteur_uid = a.uid
UNION ALL
SELECT
    'Mandats without acteurs',
    COUNT(*)
FROM mandats m
LEFT JOIN acteurs a ON m.acteur_uid = a.uid
WHERE a.uid IS NULL
UNION ALL
SELECT
    'Suppléants with mandats',
    COUNT(*)
FROM mandats_suppleants ms
INNER JOIN mandats m ON ms.mandat_uid = m.uid;
"

echo ""
echo "=============================================="
echo "✓ IMPORT COMPLETED"
echo "=============================================="