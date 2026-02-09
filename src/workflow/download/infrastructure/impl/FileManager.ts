import fs from 'fs';
import path from 'path';
import {IFileManager} from "../IFileManager";

export class FileManager implements IFileManager {
    private readonly PROJECT_ROOT: string;
    private readonly BASE_DOWNLOAD_DIR: string;
    private readonly ZIP_DIR: string;
    private readonly UNZIP_DIR: string;

    constructor() {
        this.PROJECT_ROOT = path.resolve(__dirname, '../../../../..');
        this.BASE_DOWNLOAD_DIR = path.join(this.PROJECT_ROOT, 'data', 'download');
        this.ZIP_DIR = path.join(this.BASE_DOWNLOAD_DIR, 'zip');
        this.UNZIP_DIR = path.join(this.BASE_DOWNLOAD_DIR, 'unzip');

        console.log('📁 Project root:', this.PROJECT_ROOT);
        console.log('📁 Download dir:', this.BASE_DOWNLOAD_DIR);
    }

    /**
     * Crée un dossier timestampé pour les téléchargements
     * Format: data/download/zip/2025-02-09_14-30-45
     */
    createTimestampedZipDir(): string {
        const timestamp = this.generateTimestamp();
        const timestampedDir = path.join(this.ZIP_DIR, timestamp);

        this.ensureDir(timestampedDir);
        return timestampedDir;
    }

    /**
     * Prépare les chemins de téléchargement
     */
    prepareDownloadPaths(
        timestampedZipDir: string,
        filename: string,
        domain: string
    ): { zipDir: string; zipFilePath: string; unzipDir: string } {
        const zipFilePath = path.join(timestampedZipDir, filename);
        const unzipDir = path.join(this.UNZIP_DIR, domain);

        this.ensureDir(unzipDir);

        return {
            zipDir: timestampedZipDir,
            zipFilePath,
            unzipDir
        };
    }

    async fileExists(filepath: string): Promise<boolean> {
        return fs.existsSync(filepath);
    }

    private ensureDir(dir: string): void {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    private generateTimestamp(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    }
}