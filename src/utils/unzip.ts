import fs from "fs";
import unzipper from "unzipper";

export async function unzipFile(zipPath: string, targetDir: string): Promise<void> {
    if (!fs.existsSync(zipPath)) {
        throw new Error(`Zip file does not exist: ${zipPath}`);
    }

    // Créer le dossier cible si pas fait
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
        fs.createReadStream(zipPath)
            .pipe(unzipper.Extract({ path: targetDir }))
            .on('close', () => {
                //Attendre un peu
                setTimeout(() => resolve(), 5000);
            })
            .on('error', (error) => {
                reject(new Error(`Unzip failed: ${error.message}`));
            });
    });
}