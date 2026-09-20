import { Logger } from '../../../../utils/logger';
import * as path from 'path';
import { IDirectorySource } from "../../infrastructure/IDirectorySource";
import { IExtractor } from "../../infrastructure/IExtractor";

export interface BatchFlushOptions {
    // Flush (write + clear the extractor's in-memory tables) every N processed files.
    everyFiles: number;
    onFlush: (tables: Record<string, any[]>) => Promise<void> | void;
}

export class BatchProcessor {
    private processedFilesCount: number = 0;

    constructor(
        private directorySource: IDirectorySource,
        private extractor: IExtractor,
        private logger: Logger,
        private flush?: BatchFlushOptions
    ) {}

    isFlushConfigured(): boolean {
        return this.flush !== undefined;
    }

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

            const isLastFile = i === files.length - 1;
            if (this.flush && !isLastFile && (i + 1) % this.flush.everyFiles === 0) {
                await this.flushBatch();
            }
        }

        this.processedFilesCount = files.length;
        console.log('\n'); // format
        this.logger.success('Processing complete!');
    }

    // The tail batch (last partial chunk since the previous flush, or
    // everything if flush is disabled) is left for the caller to read via
    // getTables()/getErrors() and write once process() resolves.
    private async flushBatch(): Promise<void> {
        if (!this.flush) return;
        const tables = this.extractor.getTables();
        await this.flush.onFlush(tables);
        this.extractor.clearTables();
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