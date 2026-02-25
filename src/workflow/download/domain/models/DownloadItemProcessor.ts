import { Logger } from "../../../../utils/logger";
import {DownloadResult, ProcessOptions} from "../../types/types";
import {IFileDownloader} from "../../infrastructure/IFileDownloader";
import {IFileExtractor} from "../../infrastructure/IFileExtrator";
import {IFileVerifier} from "../../infrastructure/IFileVerifier";
import {IFileManager} from "../../infrastructure/IFileManager";
import {IParamCurrentLegislatureService} from "../../../_common/infrastructure/services/IParamCurrentLegislature.service";
import {IMonitorDataDownloadService} from "../../../_common/infrastructure/services/IMonitorDataDownload.service";
import {DownloadItem} from "./entities/DownloadItem.entity";

export class DownloadItemProcessor {
    constructor(
        private fileDownloader: IFileDownloader,
        private fileExtractor: IFileExtractor,
        private fileVerifier: IFileVerifier,
        private fileManager: IFileManager,
        private currentLegislatureService: IParamCurrentLegislatureService,
        private monitorDataDownloadService: IMonitorDataDownloadService,
        private logger: Logger
    ) {}

    async process(
        item: DownloadItem,
        timestampedZipDir: string,
        options: ProcessOptions
    ): Promise<DownloadResult> {
        // Vérifier si on doit skip le fichier
        const shouldSkip = await this.shouldSkip(item, options);
        if (shouldSkip) {
            return this.createSkipResult(
                item,
                'Already downloaded (archive legislature)'
            );
        }

        // Préparer les chemins
        const paths = this.fileManager.prepareDownloadPaths(
            timestampedZipDir,
            item.fileName,
            item.legislature,
            item.domain
        );

        this.logger.debug(`Paths prepared:`, paths);

        // Télécharger
        this.logger.info(`Downloading to: ${paths.zipFilePath}`);
        await this.fileDownloader.downloadWithRetry(
            item.url,
            paths.zipFilePath,
            options.maxRetries
        );

        // Extraire
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

    /**
     * Détermine si un item doit être skippé
     *
     * RULES :
     * 1. Si --force : ne jamais skip
     * 2. Si legislature courante : ne jamais skip (données à jour)
     * 3. Si legislature archive ET déjà téléchargé en BDD : skip
     */
    private async shouldSkip(
        item: DownloadItem,
        options: ProcessOptions
    ): Promise<boolean> {
        // Rule 1
        if (options.force) {
            this.logger.debug(`Force mode enabled - downloading ${item.fileName}`);
            return false;
        }

        // Rule 2
        const isCurrent = await this.currentLegislatureService.isCurrentLegislature(item.legislature);
        if (isCurrent) {
            this.logger.debug(`Legislature ${item.legislature} is current - downloading ${item.fileName}`);
            return false;
        }

        // Rule 3
        const downloadStatus = await this.monitorDataDownloadService.getDownloadStatus(item.sourceId);

        if (downloadStatus && downloadStatus.downloaded) {
            this.logger.info(
                `📦 Legislature ${item.legislature} (archive) - ${item.fileName} already downloaded on ${downloadStatus.lastDownloadAt?.toLocaleDateString()}`
            );
            return true;
        }

        this.logger.debug(`Legislature ${item.legislature} (archive) - ${item.fileName} not yet downloaded`);
        return false;
    }

    private createSkipResult(
        item: DownloadItem,
        reason: string
    ): DownloadResult {
        return {
            success: true,
            item,
            path: undefined,
            skipped: true,
            reason
        };
    }
}