import {IParamDataSourceService} from "../../../infrastructure/common/services/IParamDataSources.service";
import {IMonitorDataDownloadService} from "../../../infrastructure/common/services/IMonitorDataDownload.service";
import {DownloadItemProcessor} from "../../domain/download/DownloadItemProcessor";
import {IFileManager} from "../../../infrastructure/download/IFileManager";
import {Logger} from "../../../../../utils/logger";
import {DownloadItem, DownloadResult, Filters, UseCaseOptions} from "../../../types/types";

export class DownloadFilesUseCase {
    constructor(
        private paramDataSourceService: IParamDataSourceService,
        private monitorDataDownloadService: IMonitorDataDownloadService,
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

        this.logger.info(`Found ${items.length} items to process`);

        // Créer un dossier timestampé pour cette session de téléchargement
        const timestampedZipDir = this.fileManager.createTimestampedZipDir();
        this.logger.info(`📁 Download session directory: ${timestampedZipDir}`);

        // Afficher la structure des dossiers
        this.logDownloadStructure(items, timestampedZipDir);

        const results = options.parallel
            ? await this.processInParallel(items, timestampedZipDir, options)
            : await this.processSequentially(items, timestampedZipDir, options);

        this.logFinalStructure(timestampedZipDir);

        return results;
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

    private async processInParallel(
        items: DownloadItem[],
        timestampedZipDir: string,
        options: UseCaseOptions
    ): Promise<DownloadResult[]> {
        const maxConcurrency = options.maxConcurrency || 3;
        const results: DownloadResult[] = [];

        for (let i = 0; i < items.length; i += maxConcurrency) {
            const batch = items.slice(i, i + maxConcurrency);
            const batchResults = await Promise.all(
                batch.map((item, batchIndex) =>
                    this.processOne(item, timestampedZipDir, i + batchIndex, items.length, options)
                )
            );
            results.push(...batchResults);
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
        this.logger.info(`[${index + 1}/${total}] Processing: ${item.fileName} (${item.domain})`);

        try {
            const result = await this.processor.process(item, timestampedZipDir, {
                force: options.force || false,
                maxRetries: options.maxRetries || 3
            });

            if (result.success && result.checksum && result.fileSize) {
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

            await this.monitorDataDownloadService.markAsFailed(item.fileName,item.sourceId, err.message);

            return {
                success: false,
                item,
                error: err
            };
        }
    }

    private logResult(result: DownloadResult): void {
        if (result.skipped) {
            this.logger.info(`File skipped: ${result.reason}`);
        } else if (result.success) {
            this.logger.success(`File treated : ${result.item.fileName}`);
        }
    }

    private logDownloadStructure(items: DownloadItem[], timestampedZipDir: string): void {
        const domains = [...new Set(items.map(item => item.domain))];

        this.logger.info('📂 Download Structure:');
        this.logger.info(`├─ ${timestampedZipDir}/`);
        items.forEach((item, index) => {
            const prefix = index === items.length - 1 ? '└─' : '├─';
            this.logger.info(`│  ${prefix} ${item.fileName}`);
        });
        this.logger.info(`├─ data/download/unzip/`);
        domains.forEach((domain, index) => {
            const prefix = index === domains.length - 1 ? '└─' : '├─';
            this.logger.info(`   ${prefix} ${domain}/`);
        });
        this.logger.info('');
    }

    private logFinalStructure(timestampedZipDir: string): void {
        this.logger.info('✅ Files organized as follows:');
        this.logger.info(`📦 ZIP files: ${timestampedZipDir}`);
        this.logger.info(`📄 Extracted files: data/download/unzip/<domain>/`);
    }
}