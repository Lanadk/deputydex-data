#!/usr/bin/env ts-node
import * as path from 'path';
import {DirectorySource} from "./batch/FileSource";
import {ActeursExtractor} from "./batch/JSONextractors/domains/ActeursExtractor";
import {BatchProcessor} from "./batch/BatchProcessor";

async function main() {
    const baseDataDir = path.resolve('./data');
    const baseExportDir = path.resolve('./exports');

    // -------- Acteurs --------
    const acteursSource = new DirectorySource(path.join(baseDataDir, 'acteurs'));
    const acteursExtractor = new ActeursExtractor();
    const acteursBatch = new BatchProcessor(acteursSource, acteursExtractor);

    await acteursBatch.run();

    // "both" export: fichier complet + fichiers séparés
    const completeFile = path.join(baseExportDir, 'acteurs-complete.json');
    const separateDir = path.join(baseExportDir, 'tables');

    // Export fichier unique
    acteursBatch.exportToJSON(completeFile);
    // Export fichiers séparés
    acteursBatch.exportSeparateFiles(separateDir);

    console.log('✓ Acteurs exportés\n');




    console.log('🎉 Tous les extractors ont terminé !');
}

main();
