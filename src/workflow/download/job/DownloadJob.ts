import {DownloadFilesUseCase} from "../domain/usecases/DownloadFilesUseCase";
import {Logger} from "../../../utils/logger";
import {DownloadResult, JobOptions} from "../types/types";

export class DownloadJob {
    constructor(
        private downloadUseCase: DownloadFilesUseCase,
        private logger: Logger
    ) {}

    async run(options: JobOptions = {}): Promise<DownloadResult[]> {
        this.logger.info('======== Starting Download Job ========');
        this.logger.debug('Options:', options);

        const results = await this.downloadUseCase.execute(options.filters, {
            force: options.force,
            maxRetries: options.maxRetries,
            parallel: options.parallel,
            maxConcurrency: options.maxConcurrency
        });

        this.logSummary(results);
        return results;
    }

    private logSummary(results: DownloadResult[]): void {
        const stats = this.calculateStats(results);

        this.logger.info('='.repeat(25));
        this.logger.info('DOWNLOAD SUMMARY');
        this.logger.info('='.repeat(25));
        this.logger.info(`Total:      ${stats.total}`);
        this.logger.info(`Success:    ${stats.successful}`);
        this.logger.info(`Skipped:    ${stats.skipped}`);
        if (stats.failed > 0) this.logger.error(`Failed:     ${stats.failed}`);
        this.logger.info('='.repeat(25));
    }

    private calculateStats(results: DownloadResult[]) {
        return {
            total: results.length,
            successful: results.filter(r => r.success && !r.skipped).length,
            skipped: results.filter(r => r.skipped).length,
            failed: results.filter(r => !r.success).length
        };
    }
}