import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

/**
 * Extrait une archive dans `targetDir` en remplaçant son contenu précédent.
 *
 * L'archive est extraite dans un dossier temporaire neuf, à côté de la cible,
 * qui prend ensuite sa place (deux renommages), puis l'ancien contenu est
 * supprimé. Pourquoi ne pas extraire directement par-dessus l'existant :
 *
 * - droits : adm-zip fait un `chmod` sur chaque fichier qu'il écrit
 *   (`chmodSync(path, attr || 0o666)`, même sans keepOriginalPermission). Seul
 *   le propriétaire d'un fichier peut le chmoder : réécrire un fichier créé par
 *   un autre utilisateur (cron en app user, run manuel en deployer) échoue en
 *   EPERM, même avec les droits d'écriture du groupe. Dans un dossier neuf, tous
 *   les fichiers appartiennent à l'utilisateur courant ;
 * - fichiers périmés : un fichier retiré de la source (réunion supprimée…) ne
 *   reste plus dans le dossier, où le parser le relirait ;
 * - atomicité : une extraction qui échoue laisse le contenu précédent intact,
 *   au lieu d'un dossier à moitié mis à jour.
 *
 * Supprimer l'ancien contenu demande seulement le droit d'écriture sur ses
 * dossiers (groupe en écriture, cf. umask 002 du cron et de menu.sh), pas d'en
 * être propriétaire.
 */
export async function unzipFile(zipPath: string, targetDir: string): Promise<void> {
    if (!fs.existsSync(zipPath)) {
        throw new Error(`Zip file does not exist: ${zipPath}`);
    }

    const parentDir = path.dirname(targetDir);
    fs.mkdirSync(parentDir, { recursive: true });

    const suffix = `${process.pid}-${Date.now()}`;
    const extractDir = `${targetDir}.extract-${suffix}`;
    const previousDir = `${targetDir}.previous-${suffix}`;

    try {
        new AdmZip(zipPath).extractAllTo(extractDir, true);
    } catch (error) {
        fs.rmSync(extractDir, { recursive: true, force: true });
        throw error;
    }

    const hadPrevious = fs.existsSync(targetDir);
    if (hadPrevious) fs.renameSync(targetDir, previousDir);
    try {
        fs.renameSync(extractDir, targetDir);
    } catch (error) {
        // Remet l'ancien contenu en place plutôt que de laisser la cible absente.
        if (hadPrevious) fs.renameSync(previousDir, targetDir);
        fs.rmSync(extractDir, { recursive: true, force: true });
        throw error;
    }

    if (hadPrevious) {
        try {
            fs.rmSync(previousDir, { recursive: true, force: true });
        } catch (error) {
            // Les nouvelles données sont en place : on ne fait pas échouer le
            // téléchargement pour un reliquat, mais on le signale (droits du dossier).
            console.warn(`[WARN   ⚠️]: Ancien contenu non supprimé (${previousDir}) : ${(error as Error).message}`);
        }
    }
}
