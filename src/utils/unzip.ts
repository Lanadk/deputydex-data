import fs from "fs";
import AdmZip from "adm-zip";

export async function unzipFile(zipPath: string, targetDir: string): Promise<void> {
    if (!fs.existsSync(zipPath)) {
        throw new Error(`Zip file does not exist: ${zipPath}`);
    }

    // Créer le dossier cible si nécessaire
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(targetDir, true);
}