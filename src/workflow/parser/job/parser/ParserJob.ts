import {ParseFilesUseCase} from "../../domain/usecases/ParseFilesUseCase";
import {Logger} from "../../../../utils/logger";

export interface ParserJobOptions {
    outputDir: string;
    exportSeparateFiles?: boolean;
    exportSingleFile?: boolean;
}

export class ParserJob {
    constructor(
        private parseUseCase: ParseFilesUseCase,
        private logger: Logger
    ) {}

    async run(options: ParserJobOptions): Promise<void> {
        this.logger.info('======== Starting Job ========');

        try {
            const result = await this.parseUseCase.execute(options.outputDir, {
                exportSeparateFiles: options.exportSeparateFiles,
                exportSingleFile: options.exportSingleFile
            });

            this.logger.success('Parser job completed successfully');
            this.logger.info(`Files processed: ${result.totalFiles}`);
            this.logger.info(`Tables created: ${result.totalTables}`);
            this.logger.info(`Total records: ${result.totalRecords}`);

            if (result.errors > 0) {
                this.logger.warn(`Errors: ${result.errors}`);
            }

        } catch (error) {
            this.logger.error('Parser job failed:', error);
            throw error;
        }
    }
}