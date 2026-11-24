import {IParamDataSourceService} from "../../../_common/infrastructure/services/IParamDataSources.service";
import {IMonitorDataDownloadService} from "../../../_common/infrastructure/services/IMonitorDataDownload.service";
import {IParamCurrentLegislatureService} from "../../../_common/infrastructure/services/IParamCurrentLegislature.service";
import {DownloadItemProcessor} from "../models/DownloadItemProcessor";
import {IFileManager} from "../../infrastructure/IFileManager";
import {Logger} from "../../../../utils/logger";
import {DownloadResult, Filters, UseCaseOptions} from "../../types/types";
import {DownloadItem} from "../models/entities/DownloadItem.entity";

export class DownloadFilesUsecase {
    constructor(
        private paramDataSourceService: IParamDataSourceService,
        private monitorDataDownloadService: IMonitorDataDownloadService,
        private currentLegislatureService: IParamCurrentLegislatureService,
        private processor: DownloadItemProcessor,
        private fileManager: IFileManager,
        private logger: Logger
    ) {}

    async execute(filters?: Filters, options: UseCaseOptions = {}): Promise<DownloadResult[]> {
        const items = await this.paramDataSourceService.getDownloadItems(filters);

        if (items.length === 0) {
            this.logger.warn('No items to download');
            return [];
        }

        // Afficher la legislature courante
        const currentLegislature = await this.currentLegislatureService.getCurrentLegislatureNumber();
        this.logger.info(`📋 Current legislature: ${currentLegislature}`);
        this.logger.info(`📦 Found ${items.length} items to process`);

        // Créer un dossier timestampé pour cette session
        const timestampedZipDir = this.fileManager.createTimestampedZipDir();
        this.logger.info(`📁 Download session directory: ${timestampedZipDir}`);

        // Afficher la structure
        this.logDownloadStructure(items, timestampedZipDir);

        const results = await this.processSequentially(items, timestampedZipDir, options);

        if (options.retryFailedAfterMs !== undefined) {
            await this.retryFailed(results, timestampedZipDir, options, options.retryFailedAfterMs);
        }

        this.logFinalStructure(timestampedZipDir, results);

        return results;
    }

    /**
     * Seconde passe : les fichiers en échec sont retentés une fois tous les
     * autres traités, après une pause, plutôt qu'enchaînés aussitôt. Les
     * résultats sont remplacés sur place.
     */
    private async retryFailed(
        results: DownloadResult[],
        timestampedZipDir: string,
        options: UseCaseOptions,
        delayMs: number
    ): Promise<void> {
        const failedIndexes = results.flatMap((r, i) => (r.success ? [] : [i]));
        if (failedIndexes.length === 0) return;

        this.logger.warn(`\n🔁 ${failedIndexes.length} échec(s) : nouvelle passe dans ${Math.round(delayMs / 1000)}s`);
        await new Promise(resolve => setTimeout(resolve, delayMs));

        for (const [n, index] of failedIndexes.entries()) {
            results[index] = await this.processOne(results[index].item, timestampedZipDir, n, failedIndexes.length, options);
        }
    }

    private async processSequentially(
        items: DownloadItem[],
        timestampedZipDir: string,
        options: UseCaseOptions
    ): Promise<DownloadResult[]> {
        const results: DownloadResult[] = [];

        for (const [index, item] of items.entries()) {
            const result = await this.processOne(item, timestampedZipDir, index, items.length, options);
            results.push(result);
        }

        return results;
    }

    private async processOne(
        item: DownloadItem,
        timestampedZipDir: string,
        index: number,
        total: number,
        options: UseCaseOptions
    ): Promise<DownloadResult> {
        this.logger.info(`\n[${index + 1}/${total}] Processing: ${item.fileName} (Legislature ${item.legislature}, Domain: ${item.domain})`);

        try {
            const result = await this.processor.process(item, timestampedZipDir, {
                force: options.force || false,
                maxRetries: options.maxRetries || 3
            });

            // Enregistrer en BDD seulement si téléchargé
            if (result.success && !result.skipped && result.checksum && result.fileSize) {
                await this.monitorDataDownloadService.markAsDownloaded(
                    item.fileName,
                    item.sourceId,
                    result.checksum,
                    result.fileSize
                );
            }

            this.logResult(result);
            return result;

        } catch (error) {
            const err = error as Error;
            this.logger.error(`Failed: ${item.fileName} - ${err.message}`);

            await this.monitorDataDownloadService.markAsFailed(item.fileName, item.sourceId, err.message);

            return {
                success: false,
                item,
                error: err
            };
        }
    }

    private logResult(result: DownloadResult): void {
        if (result.skipped) {
            this.logger.warn(`Skipped: ${result.reason}`);
        } else if (result.success) {
            this.logger.success(`Downloaded and extracted`);
        }
    }

    private logDownloadStructure(items: DownloadItem[], timestampedZipDir: string): void {
        const domains = [...new Set(items.map(item => item.domain))];

        this.logger.debug('\n📂 Download Structure:');
        this.logger.debug(`├─ ${timestampedZipDir}/`);
        items.forEach((item, index) => {
            const prefix = index === items.length - 1 ? '└─' : '├─';
            this.logger.debug(`│  ${prefix} ${item.fileName} (L${item.legislature})`);
        });
        this.logger.debug(`├─ data/download/unzip/`);
        domains.forEach((domain, index) => {
            const prefix = index === domains.length - 1 ? '└─' : '├─';
            this.logger.debug(`   ${prefix} ${domain}/`);
        });
        this.logger.debug('');
    }

    private logFinalStructure(timestampedZipDir: string, results: DownloadResult[]): void {
        const stats = {
            total: results.length,
            downloaded: results.filter(r => r.success && !r.skipped).length,
            skipped: results.filter(r => r.skipped).length,
            failed: results.filter(r => !r.success).length
        };

        this.logger.debug('='.repeat(50));
        this.logger.debug('DOWNLOAD SUMMARY');
        this.logger.debug('='.repeat(50));
        this.logger.debug(`Total:      ${stats.total}`);
        this.logger.success(`Downloaded: ${stats.downloaded}`);
        this.logger.debug(`Skipped:    ${stats.skipped}`);
        if (stats.failed > 0) this.logger.error(`Failed:     ${stats.failed}`);
        this.logger.debug('='.repeat(50));
        this.logger.debug(`📦 ZIP files: ${timestampedZipDir}`);
        this.logger.debug(`📄 Extracted: data/download/unzip/<domain>/`);
    }
}