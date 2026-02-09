import { Logger } from '../../../../utils/logger';
import {BatchProcessor} from "../models/BatchProcessor";
import {ExportSummary, IJsonFileWriter} from "../../infrastructure/IJsonFileWriter";

export interface ParseOptions {
    exportSeparateFiles?: boolean;
    exportSingleFile?: boolean;
}

export interface ParseResult {
    totalFiles: number;
    totalTables: number;
    totalRecords: number;
    errors: number;
}

export class ParseFilesUseCase {
    constructor(
        private processor: BatchProcessor,
        private fileWriter: IJsonFileWriter,
        private logger: Logger
    ) {}

    async execute(
        outputDir: string,
        options: ParseOptions = { exportSeparateFiles: true }
    ): Promise<ParseResult> {
        // Process files
        await this.processor.process();

        const tables = this.processor.getTables();
        const errors = this.processor.getErrors();

        // Export
        if (options.exportSeparateFiles) {
            this.logger.info('Exporting to separate files...');
            this.fileWriter.writeToSeparateFiles(tables, outputDir);
        }

        if (options.exportSingleFile) {
            this.logger.info('Exporting to single file...');
            this.fileWriter.writeToSingleFile(tables, `${outputDir}/complete.json`);
        }

        // Write errors
        this.fileWriter.writeErrors(errors, outputDir);

        // Summary
        const summary = this.fileWriter.getSummary();
        this.logSummary(summary);

        return {
            totalFiles: this.processor.getProcessedFilesCount() || 0,
            totalTables: summary.totalTables,
            totalRecords: summary.totalRecords,
            errors: summary.errors
        };
    }

    private logSummary(summary: ExportSummary): void {
        this.logger.info('='.repeat(25));
        this.logger.info('EXPORT SUMMARY');
        this.logger.info('='.repeat(25));

        for (const [table, count] of Object.entries(summary.tables)) {
            this.logger.info(`${table.padEnd(35)} ${count}`);
        }

        this.logger.info('='.repeat(25));

        if (summary.errors > 0) {
            this.logger.warn(`⚠️  ${summary.errors} errors recorded`);
        }
    }
}