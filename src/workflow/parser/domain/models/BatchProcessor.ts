import { Logger } from '../../../../utils/logger';
import * as path from 'path';
import { IDirectorySource } from "../../infrastructure/IDirectorySource";
import { IExtractor } from "../../infrastructure/IExtractor";

export class BatchProcessor {
    private processedFilesCount: number = 0;

    constructor(
        private directorySource: IDirectorySource,
        private extractor: IExtractor,
        private logger: Logger
    ) {}

    async process(): Promise<void> {
        const files = this.directorySource.getFiles();

        if (files.length === 0) {
            this.logger.warn('No files found to process');
            this.processedFilesCount = 0;
            return;
        }

        this.logger.info(`Found ${files.length} files to process`);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const percentage = ((i + 1) / files.length * 100).toFixed(1);

            process.stdout.write(
                `\r[${i + 1}/${files.length}] (${percentage}%) ${path.basename(file).padEnd(50, ' ')}`
            );

            try {
                await this.extractor.processFile(file);
            } catch (err: any) {
                this.logger.error(`Error processing ${file}: ${err.message || err}`);
            }
        }

        this.processedFilesCount = files.length;
        this.logger.info('Processing complete!');
    }

    getTables(): Record<string, any[]> {
        return this.extractor.getTables();
    }

    getErrors(): { file: string; error: string }[] {
        return this.extractor.getErrors();
    }

    getProcessedFilesCount(): number {
        return this.processedFilesCount;
    }
}