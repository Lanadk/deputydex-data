export interface ExportSummary {
    totalTables: number;
    totalRecords: number;
    tables: Record<string, number>;
    errors: number;
}

export interface IJsonFileWriter {
    writeToSingleFile(data: Record<string, any[]>, outputPath: string): void;
    writeToSeparateFiles(data: Record<string, any[]>, outputDir: string): void;
    writeErrors(errors: { file: string; error: string }[], outputPath: string): void;
    getSummary(): ExportSummary;
}