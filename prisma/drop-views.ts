import { prisma } from "./prisma";

async function main() {
    console.log('🗑️ Suppression des vues matérialisées...');

    await prisma.$executeRawUnsafe(`
        DROP MATERIALIZED VIEW IF EXISTS agg_acteurs_stats_professions CASCADE;
        DROP MATERIALIZED VIEW IF EXISTS agg_acteurs_stats_genre CASCADE;
        DROP MATERIALIZED VIEW IF EXISTS agg_acteurs_stats_age CASCADE;
        DROP MATERIALIZED VIEW IF EXISTS agg_acteurs_stats_geographie_election CASCADE;
        DROP MATERIALIZED VIEW IF EXISTS agg_acteurs_stats_geographie_naissance CASCADE;
        
        DROP MATERIALIZED VIEW IF EXISTS agg_groupes_stats_cohesion CASCADE;
        DROP MATERIALIZED VIEW IF EXISTS agg_groupes_current_effectifs CASCADE;
        DROP MATERIALIZED VIEW IF EXISTS agg_groupes_legislature_effectifs CASCADE;
        DROP MATERIALIZED VIEW IF EXISTS agg_groupes_stats_votes_participation CASCADE;
        DROP MATERIALIZED VIEW IF EXISTS agg_groupes_stats_votes_positions CASCADE;
    `);

    console.log('✅ Vues matérialisées supprimées');
}

main()
    .catch((e) => {
        console.error('❌ Erreur:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });