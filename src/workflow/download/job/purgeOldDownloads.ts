import fs from "fs";
import path from "path";
import { Logger, LogLevel } from "../../../utils/logger";
import { FileManager } from "../infrastructure/impl/FileManager";

// ==============================================================================
// PURGE DES ANCIENS TÉLÉCHARGEMENTS
// ==============================================================================
// Chaque download crée un dossier data/download/zip/<YYYY-MM-DD_HH-mm-ss> avec
// tous les zips de la collecte, jamais supprimé ensuite : ~11 Go en prod le
// 2026-11-25. On ne garde que les KEEP derniers (une semaine de collectes
// quotidiennes). Le dossier unzip/ n'est pas concerné (écrasé à chaque collecte).
//
// Non bloquant : appelé par updateAll après l'import, une erreur ici est loggée
// mais ne doit pas interrompre la suite de l'update (exit 0).
// ==============================================================================

export const KEEP_ZIP_DIRS = 7;

// Format produit par FileManager.generateTimestamp : l'ordre lexicographique est
// l'ordre chronologique. Tout autre nom (dossier créé à la main...) est ignoré.
const TIMESTAMP_DIR = /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/;

export function purgeOldZipDirs(zipDir: string, keep: number = KEEP_ZIP_DIRS): string[] {
    if (!Number.isInteger(keep) || keep < 1) {
        throw new Error(`keep doit être un entier >= 1 (reçu : ${keep})`);
    }
    if (!fs.existsSync(zipDir)) {
        return [];
    }

    const sessions = fs
        .readdirSync(zipDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && TIMESTAMP_DIR.test(entry.name))
        .map(entry => entry.name)
        .sort();

    const toDelete = sessions.slice(0, Math.max(0, sessions.length - keep));
    for (const name of toDelete) {
        fs.rmSync(path.join(zipDir, name), { recursive: true, force: true });
    }
    return toDelete;
}

function main(): void {
    const logger = new Logger(LogLevel.INFO);
    try {
        const zipDir = new FileManager().getZipDir();
        const deleted = purgeOldZipDirs(zipDir);
        if (deleted.length === 0) {
            logger.info(`Aucun dossier de téléchargement à purger (${KEEP_ZIP_DIRS} derniers conservés)`);
        } else {
            logger.success(`🧹 ${deleted.length} dossier(s) de téléchargement purgé(s) : ${deleted.join(", ")}`);
        }
    } catch (error) {
        logger.error("Purge des anciens téléchargements en échec (non bloquant) :", error);
    }
}

export { main };

if (require.main === module) {
    main();
}
