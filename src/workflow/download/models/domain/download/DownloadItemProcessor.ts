import {IFileDownloader} from "../../../infrastructure/download/IFileDownloader";
import {IFileExtractor} from "../../../infrastructure/download/IFileExtrator";
import {IFileVerifier} from "../../../infrastructure/download/IFileVerifier";
import {IFileManager} from "../../../infrastructure/download/IFileManager";
import {Logger} from "../../../../../utils/logger";
import {DownloadItem, DownloadResult, ProcessOptions} from "../../../types/types";

export class DownloadItemProcessor {
    constructor(
        private fileDownloader: IFileDownloader,
        private fileExtractor: IFileExtractor,
        private fileVerifier: IFileVerifier,
        private fileManager: IFileManager,
        private logger: Logger
    ) {}

    async process(
        item: DownloadItem,
        timestampedZipDir: string,
        options: ProcessOptions
    ): Promise<DownloadResult> {
        // Préparer les chemins
        const paths = this.fileManager.prepareDownloadPaths(
            timestampedZipDir,
            item.fileName,
            item.domain
        );

        this.logger.debug(`Paths prepared:`, paths);

        // Vérifier si on peut skip (seulement si force = false et fichier existe) //TODO faut modifier les conditions de skips
        if (await this.shouldSkip(item, paths.zipFilePath, options)) {
            return this.createSkipResult(
                item,
                paths.zipFilePath,
                'File already exists with valid checksum'
            );
        }

        // Télécharger dans data/download/zip/TIMESTAMP/
        this.logger.info(`Downloading to: ${paths.zipFilePath}`);
        await this.fileDownloader.downloadWithRetry(
            item.url,
            paths.zipFilePath,
            options.maxRetries
        );

        // Extraire dans data/download/unzip/DOMAIN/
        this.logger.info(`Extracting to: ${paths.unzipDir}`);
        await this.fileExtractor.extract(paths.zipFilePath, paths.unzipDir);

        // Calculer checksum et taille
        const checksum = await this.fileVerifier.calculateChecksum(paths.zipFilePath);
        const fileSize = await this.fileVerifier.getFileSize(paths.zipFilePath);

        return {
            success: true,
            item,
            path: paths.zipFilePath,
            checksum,
            fileSize
        };
    }

    private async shouldSkip(
        item: DownloadItem,
        zipFilePath: string,
        options: ProcessOptions
    ): Promise<boolean> {
        if (options.force) return false;
        if (!await this.fileManager.fileExists(zipFilePath)) return false;
        if (!item.checksum) return true;

        const isValid = await this.fileVerifier.verifyChecksum(zipFilePath, item.checksum);
        if (!isValid) {
            this.logger.warn('Checksum mismatch - re-downloading');
        }
        return isValid;
    }

    private createSkipResult(
        item: DownloadItem,
        path: string,
        reason: string
    ): DownloadResult {
        return {
            success: true,
            item,
            path,
            skipped: true,
            reason
        };
    }
}