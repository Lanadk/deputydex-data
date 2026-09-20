export interface IExtractor {
    processFile(filePath: string, data?: any): Promise<void> | void;
    getTables(): Record<string, any[]>;
    getErrors(): { file: string; error: string }[];
    // Resets the in-memory accumulators after their current content has been
    // written to disk, so a long run can flush periodically instead of
    // holding every record in memory until the end.
    clearTables(): void;
}