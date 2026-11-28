#!/usr/bin/env bash
set -e

# Comme le cron (umask 002) : fichiers et dossiers créés en écriture pour le
# groupe, pour qu'un run manuel (deployer) et le cron (app user) puissent
# chacun remplacer ce que l'autre a téléchargé dans data/.
umask 002

# ts-node du projet (node_modules), comme le cron : jamais téléchargé à la volée.
TS_NODE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/node_modules/.bin/ts-node"

# ==============================================================================
# DEPUTYDEX - MAIN MENU
# ==============================================================================

# ==============================================================================
# FUNCTIONS
# ==============================================================================

# -- Download ------------------------------------------------------------------
run_download_all()              { "$TS_NODE" ./workflow/download/job/trtCollecteData.ts; }

# -- Parser --------------------------------------------------------------------
run_parser_all()                { "$TS_NODE" ./workflow/parser/job/trtCheckCollecte.ts; }
run_parser_acteurs()            { "$TS_NODE" ./workflow/parser/job/unit-parser/parseActeurs.ts; }
run_parser_scrutins()           { "$TS_NODE" ./workflow/parser/job/unit-parser/parseScrutins.ts; }
run_parser_amendements()        { "$TS_NODE" ./workflow/parser/job/unit-parser/parseAmendements.ts; }
run_parser_dossiers()           { "$TS_NODE" ./workflow/parser/job/unit-parser/parseDossiers.ts; }
run_parser_documents()          { "$TS_NODE" ./workflow/parser/job/unit-parser/parseDocuments.ts; }
run_parser_reunions()           { "$TS_NODE" ./workflow/parser/job/unit-parser/parseReunions.ts; }
run_parser_questions()          { "$TS_NODE" ./workflow/parser/job/unit-parser/parseQuestions.ts; }
run_parser_debats()             { "$TS_NODE" ./workflow/parser/job/unit-parser/parseDebats.ts; }

# -- Import --------------------------------------------------------------------
run_import_all()                { "$TS_NODE" ./workflow/import/job/trtImportCollecte.ts "$1"; }
run_import_acteurs()            { "$TS_NODE" ./workflow/import/job/unit-import/importActeurs.ts; }
run_import_scrutins()           { "$TS_NODE" ./workflow/import/job/unit-import/importScrutins.ts; }
run_import_mandats()            { "$TS_NODE" ./workflow/import/job/unit-import/importMandats.ts; }
run_import_amendements()        { "$TS_NODE" ./workflow/import/job/unit-import/importAmendements.ts; }
run_import_dossiers()           { "$TS_NODE" ./workflow/import/job/unit-import/importDossiers.ts; }
run_import_documents()          { "$TS_NODE" ./workflow/import/job/unit-import/importDocuments.ts; }
run_import_reunions()           { "$TS_NODE" ./workflow/import/job/unit-import/importReunions.ts; }
run_import_questions()          { "$TS_NODE" ./workflow/import/job/unit-import/importQuestions.ts; }
run_import_debats()             { "$TS_NODE" ./workflow/import/job/unit-import/importDebats.ts; }

# -- Aggregation ---------------------------------------------------------------
run_aggregate_all_one_shot()      { "$TS_NODE" ./workflow/aggregat/job/trtAggregatCollecte-oneshot.ts; }
run_aggregate_all_refresh()       { "$TS_NODE" ./workflow/aggregat/job/trtAggregatCollecte.ts; }
run_aggregate_acteurs_one_shot()  { "$TS_NODE" ./workflow/aggregat/job/acteurs/aggregation-oneshot.ts; }
run_aggregate_acteurs_refresh()   { "$TS_NODE" ./workflow/aggregat/job/acteurs/aggregation.ts; }
run_aggregate_groupes_one_shot()  { "$TS_NODE" ./workflow/aggregat/job/groups/aggregation-oneshot.ts; }
run_aggregate_groupes_refresh()   { "$TS_NODE" ./workflow/aggregat/job/groups/aggregation.ts; }
run_aggregate_calendar_one_shot() { "$TS_NODE" ./workflow/aggregat/job/calendar/aggregation-oneshot.ts; }
run_aggregate_calendar_refresh()  { "$TS_NODE" ./workflow/aggregat/job/calendar/aggregation.ts; }
run_aggregate_deputes_one_shot()  { "$TS_NODE" ./workflow/aggregat/job/deputes/aggregation-oneshot.ts; }
run_aggregate_deputes_refresh()   { "$TS_NODE" ./workflow/aggregat/job/deputes/aggregation.ts; }
# Présence : les briques (reunions, debats, scrutins) puis leur consolidation (presence), dans cet ordre.
run_aggregate_presence_refresh() {
    for domain in reunions debats scrutins presence; do
        "$TS_NODE" "./workflow/aggregat/job/$domain/aggregation.ts"
    done
}
run_aggregate_presence_one_shot() {
    for domain in reunions debats scrutins presence; do
        "$TS_NODE" "./workflow/aggregat/job/$domain/aggregation-oneshot.ts"
    done
}

# DROP + recréation à la demande d'une/plusieurs vue(s) déjà créée(s) — seul
# moyen de propager un changement de définition SQL sur une vue existante (ni
# le one-shot ni le refresh ne le font, voir aggregat/repo.md). Destructif :
# demande une confirmation explicite avant de passer --yes au job.
run_aggregate_recreate_view() {
    read -p "Nom(s) de vue(s) à recréer (séparés par un espace) : " views
    if [[ -z "$views" ]]; then
        echo "⚠️  Aucune vue saisie, annulé."
        return
    fi
    echo "⚠️  Ceci va DROP (CASCADE) puis recréer : $views"
    read -p "Confirmer ? (y/N) : " confirm
    if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
        "$TS_NODE" ./workflow/aggregat/job/recreateView.ts $views --yes
    else
        echo "Annulé."
    fi
}

# -- Referentiels  ---------------------------------------------------------------
run_update_all_referentials_tables() { "$TS_NODE" ./workflow/referentials/job/trtUpdateReferentials.ts; }

# -- Enrichment  ---------------------------------------------------------------
run_all_enrichment_tables() { "$TS_NODE" ./workflow/enrichment/job/trtEnrichmentCollecte.ts; }

# -- Dataset update monitoring  ---------------------------------------------------------------
run_monitor_dataset_update() { "$TS_NODE" ./workflow/_common/job/logDatasetUpdate.ts; }

# ==============================================================================
# WORKFLOWS
# ==============================================================================

workflow_init() {
    echo "🚀 Running INIT Workflow (Download + Parser + Import + Ref CREATION + Enrichment + Aggregate CREATION)..."
    run_download_all
    run_parser_all
    run_import_all --auto-cleanup
    run_update_all_referentials_tables
    run_all_enrichment_tables
    run_aggregate_all_one_shot

    run_monitor_dataset_update
    echo "✅ Init Workflow completed"
}

workflow_update() {
    echo "🔄 Running UPDATE Workflow (Download + Parser + Import + Ref UPDATE + Enrichment + Aggregate UPDATE)..."
    run_download_all
    run_parser_all
    run_import_all --auto-cleanup
    run_update_all_referentials_tables
    run_all_enrichment_tables
    run_aggregate_all_refresh

    run_monitor_dataset_update
    echo "✅ Update Workflow completed"
}

# ==============================================================================
# SUB MENUS
# ==============================================================================

download_menu() {
    while true; do
        echo "=============================================="
        echo "  DOWNLOAD JOBS"
        echo "=============================================="
        echo ""
        echo "1) Download All"
        echo "0) Back"
        echo ""
        echo "=============================================="
        read -p "Select an option: " option

        case $option in
            1) run_download_all ;;
            0) return ;;
            *) echo "⚠️  Invalid option, please try again." ;;
        esac
    done
}

parser_menu() {
    while true; do
        echo "=============================================="
        echo "  PARSER JOBS"
        echo "=============================================="
        echo ""
        echo "1) Parse All"
        echo "2) Parse Acteurs"
        echo "3) Parse Scrutins"
        echo "4) Parse Amendements"
        echo "5) Parse Dossiers"
        echo "6) Parse Documents"
        echo "7) Parse Réunions"
        echo "8) Parse Questions"
        echo "9) Parse Débats"
        echo "0) Back"
        echo ""
        echo "=============================================="
        read -p "Select an option: " option

        case $option in
            1) run_parser_all ;;
            2) run_parser_acteurs ;;
            3) run_parser_scrutins ;;
            4) run_parser_amendements ;;
            5) run_parser_dossiers ;;
            6) run_parser_documents ;;
            7) run_parser_reunions ;;
            8) run_parser_questions ;;
            9) run_parser_debats ;;
            0) return ;;
            *) echo "⚠️  Invalid option, please try again." ;;
        esac
    done
}

import_menu() {
    while true; do
        echo "=============================================="
        echo "  IMPORT JOBS"
        echo "=============================================="
        echo ""
        echo "1) Import All"
        echo "2) Import Acteurs"
        echo "3) Import Scrutins"
        echo "4) Import Mandats"
        echo "5) Import Amendements"
        echo "6) Import Dossiers"
        echo "7) Import Documents"
        echo "8) Import Réunions"
        echo "9) Import Questions"
        echo "10) Import Débats"
        echo "0) Back"
        echo ""
        echo "=============================================="
        read -p "Select an option: " option

        case $option in
            1) run_import_all --auto-cleanup ;;
            2) run_import_acteurs ;;
            3) run_import_scrutins ;;
            4) run_import_mandats ;;
            5) run_import_amendements ;;
            6) run_import_dossiers;;
            7) run_import_documents;;
            8) run_import_reunions;;
            9) run_import_questions;;
            10) run_import_debats;;
            0) return ;;
            *) echo "⚠️  Invalid option, please try again." ;;
        esac
    done
}

aggregate_menu() {
    while true; do
        echo "=============================================="
        echo "  AGGREGATION JOBS"
        echo "=============================================="
        echo ""
        echo "1) Aggregate All (Refresh)"
        echo "2) Aggregate All (Create - One shot)"
        echo "3) Aggregate Acteurs (Refresh)"
        echo "4) Aggregate Acteurs (Create - One shot)"
        echo "5) Aggregate Groupes (Refresh)"
        echo "6) Aggregate Groupes (Create - One shot)"
        echo "7) Aggregate Calendar (Refresh)"
        echo "8) Aggregate Calendar (Create - One shot)"
        echo "9) Aggregate Deputes (Refresh)"
        echo "10) Aggregate Deputes (Create - One shot)"
        echo "11) Recreate View(s) (DROP + CREATE, on demand)"
        echo "12) Aggregate Présence (Refresh : reunions, debats, scrutins, presence)"
        echo "13) Aggregate Présence (Create - One shot)"
        echo "0) Back"
        echo ""
        echo "=============================================="
        read -p "Select an option: " option

        case $option in
            1) run_aggregate_all_refresh ;;
            2) run_aggregate_all_one_shot ;;
            3) run_aggregate_acteurs_refresh ;;
            4) run_aggregate_acteurs_one_shot ;;
            5) run_aggregate_groupes_refresh ;;
            6) run_aggregate_groupes_one_shot ;;
            7) run_aggregate_calendar_refresh ;;
            8) run_aggregate_calendar_one_shot ;;
            9) run_aggregate_deputes_refresh ;;
            10) run_aggregate_deputes_one_shot ;;
            11) run_aggregate_recreate_view ;;
            12) run_aggregate_presence_refresh ;;
            13) run_aggregate_presence_one_shot ;;
            0) return ;;
            *) echo "⚠️  Invalid option, please try again." ;;
        esac
    done
}

unit_job_menu() {
    while true; do
        echo "=============================================="
        echo "  UNIT JOB MENU"
        echo "=============================================="
        echo ""
        echo "1) Download Jobs"
        echo "2) Parser Jobs"
        echo "3) Import Jobs"
        echo "4) Aggregation Jobs"
        echo "0) Back"
        echo ""
        echo "=============================================="
        read -p "Select an option: " option

        case $option in
            1) download_menu ;;
            2) parser_menu ;;
            3) import_menu ;;
            4) aggregate_menu ;;
            0) return ;;
            *) echo "⚠️  Invalid option, please try again." ;;
        esac
    done
}

# ==============================================================================
# MAIN MENU
# ==============================================================================

while true; do
    echo "=============================================="
    echo " "
    echo "  DEPUTYDEX MAIN MENU"
    echo " "
    echo "=============================================="
    echo " ----------- "
    echo "  WORKFLOWS"
    echo " ----------- "
    echo "  1) Init          (Download + Parse + Import + Referentials CREATE + Enrichment + Aggregate CREATE)"
    echo "  2) Update        (Download + Parse + Import + Referentials UPDATE + Enrichment + Aggregate UPDATE)"
    echo " "
    echo " ----------- "
    echo "  FULL JOBS"
    echo " ----------- "
    echo "  3) Download All"
    echo "  4) Parse All"
    echo "  5) Import All"
    echo "  6) Aggregate All (Refresh)"
    echo "  7) Aggregate All (One shot)"
    echo "  8) Referentials Create / Update"
    echo "  9) Enrichment All"
    echo "  10) Recreate View(s) (DROP + CREATE, on demand)"
    echo " "
    echo " ----------- "
    echo "  UNIT JOBS"
    echo " ----------- "
    echo "  11) See unit Jobs"
    echo "  u)  Update Dataset Monitoring"
    echo " "
    echo "  0) Quit"
    echo " "
    echo "=============================================="
    read -p "Select an option: " option

    case $option in
        1) workflow_init ;;
        2) workflow_update ;;
        3) echo "📥 Downloading All..."  && run_download_all ;;
        4) echo "🛠  Parsing All..."     && run_parser_all ;;
        5) echo "📤 Importing All..."    && run_import_all --auto-cleanup ;;
        6) echo "📊 Aggregating All..."  && run_aggregate_all_refresh ;;
        7) echo "📊 Aggregating All (Create)..." && run_aggregate_all_one_shot ;;
        8) echo "📊 Referentials Update ..."  &&  run_update_all_referentials_tables ;;
        9) echo "📊 Enrichment All ..."  &&  run_all_enrichment_tables ;;
        10) run_aggregate_recreate_view ;;
        11) unit_job_menu ;;
        u|U) echo "🗓  Update Dataset Monitoring..." && run_monitor_dataset_update ;;
        0) echo "Bye! 👋" && exit 0 ;;
        *) echo "⚠️  Invalid option, please try again." ;;
    esac

    echo ""
    echo "=============================================="
    echo "✅ Done"
    echo "=============================================="
    echo ""
done