export interface ExportSummary {
    totalTables: number;
    totalRecords: number;
    tables: Record<string, number>;
    errors: number;
}

export interface IJsonFileWriter {
    writeToSingleFile(data: Record<string, any[]>, outputPath: string): void;
    // Can be called multiple times against the same outputDir (periodic flush during a run):
    // the first call per file truncates, subsequent calls append.
    writeToSeparateFiles(data: Record<string, any[]>, outputDir: string): Promise<void>;
    writeErrors(errors: { file: string; error: string }[], outputPath: string): void;
    getSummary(): ExportSummary;
}